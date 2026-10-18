import { prisma } from '../../shared/database';
import { outboxService } from '../outbox/outbox.service';
import { slaService } from '../../services/sla.service';
import { NotFoundError, BadRequestError } from '../../shared/errors';
import {
  type CreateTicketInput,
  type AddCommentInput,
  type CsatFeedbackInput,
  ActivityAction,
  WorkItemStatus,
} from '@instos/shared';

export class TicketsService {
  /**
   * Public Ticket Ingestion (used by Customer Portal, Embeddable Widget, API)
   * Executes inside single database transaction:
   * 1. Upsert Customer
   * 2. Create Ticket
   * 3. Create linked WorkItem with computed SLA deadline
   * 4. Append ActivityEvent
   * 5. Schedule OutboxJob (triggers Resend / Ethereal email notification)
   */
  async createTicket(input: CreateTicketInput) {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();

    // Resolve target team by slug or find default team
    let targetTeam = input.teamSlug
      ? await prisma.team.findUnique({ where: { slug: input.teamSlug } })
      : null;

    if (!targetTeam) {
      // Default to 'support' or first available team
      targetTeam = (await prisma.team.findFirst({ where: { slug: 'support' } })) ||
        (await prisma.team.findFirst());
    }

    if (!targetTeam) {
      throw new BadRequestError('No operational team is configured to receive support requests');
    }

    // Resolve system bot user or admin to be the creator of the work item
    const botUser = (await prisma.user.findFirst({ where: { email: 'system@instos.internal' } })) ||
      (await prisma.user.findFirst());

    if (!botUser) {
      throw new BadRequestError('System operational dispatcher user is not provisioned');
    }

    const slaDeadline = slaService.calculateSlaDeadline(input.priority);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Upsert Customer record
      const customer = await tx.customer.upsert({
        where: { email },
        update: {
          name,
          phone: input.phone || undefined,
          company: input.company || undefined,
        },
        create: {
          email,
          name,
          phone: input.phone,
          company: input.company,
        },
      });

      // 2. Create linked WorkItem
      const workItem = await tx.workItem.create({
        data: {
          title: input.title,
          description: input.description,
          type: input.category,
          priority: input.priority,
          status: WorkItemStatus.OPEN,
          teamId: targetTeam.id,
          creatorId: botUser.id,
          slaDeadline,
        },
      });

      // 3. Create Ticket record
      const ticket = await tx.ticket.create({
        data: {
          title: input.title,
          description: input.description,
          category: input.category,
          priority: input.priority,
          channel: input.channel,
          status: WorkItemStatus.OPEN,
          customerId: customer.id,
          workItemId: workItem.id,
        },
        include: {
          customer: true,
        },
      });

      // 4. Record initial ActivityEvent
      await tx.activityEvent.create({
        data: {
          workItemId: workItem.id,
          action: ActivityAction.CREATED,
          newState: {
            title: ticket.title,
            priority: ticket.priority,
            category: ticket.category,
            channel: ticket.channel,
            ticketNumber: ticket.ticketNumber,
          },
          metadata: {
            customerEmail: customer.email,
            customerName: customer.name,
            channel: ticket.channel,
          },
        },
      });

      // 5. Schedule Outbox Job to send email confirmation
      await outboxService.scheduleJob(tx, {
        aggregateType: 'TICKET',
        aggregateId: ticket.id,
        eventType: 'TICKET_CREATED',
        payload: {
          ticket: {
            id: ticket.id,
            ticketNumber: ticket.ticketNumber,
            title: ticket.title,
            trackingToken: ticket.trackingToken,
            status: ticket.status,
          },
          customer: {
            id: customer.id,
            name: customer.name,
            email: customer.email,
          },
        },
      });

      return { ticket, customer, workItem };
    });

    return {
      ticketId: result.ticket.id,
      ticketNumber: result.ticket.ticketNumber,
      trackingToken: result.ticket.trackingToken,
      title: result.ticket.title,
      status: result.ticket.status,
      createdAt: result.ticket.createdAt,
      customer: {
        name: result.customer.name,
        email: result.customer.email,
      },
    };
  }

  /**
   * Public Ticket Tracking endpoint by tracking token
   * Strictly filters out internal notes so customer never sees sensitive operator discussion!
   */
  async getTicketByTrackingToken(token: string) {
    const ticket = await prisma.ticket.findUnique({
      where: { trackingToken: token },
      include: {
        customer: { select: { id: true, name: true, email: true, company: true } },
        workItem: {
          select: {
            id: true,
            status: true,
            priority: true,
            slaDeadline: true,
            slaBreached: true,
            team: { select: { name: true, slug: true } },
            assignee: { select: { name: true, avatarUrl: true } },
            activities: {
              where: {
                action: {
                  in: [
                    ActivityAction.CREATED,
                    ActivityAction.STATUS_CHANGED,
                    ActivityAction.CLAIMED,
                    ActivityAction.WORKFLOW_APPROVED,
                    ActivityAction.CUSTOMER_CONFIRMED,
                  ],
                },
              },
              orderBy: { createdAt: 'asc' },
              select: {
                id: true,
                action: true,
                previousState: true,
                newState: true,
                createdAt: true,
              },
            },
          },
        },
        comments: {
          // Strictly only public messages (isInternal == false)
          where: { isInternal: false },
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { name: true, avatarUrl: true } },
            customerAuthor: { select: { name: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundError('Invalid tracking token or ticket not found');
    }

    return ticket;
  }

  /**
   * Customer replies directly to ticket from public tracking page
   */
  async addCustomerReply(token: string, input: AddCommentInput) {
    const ticket = await prisma.ticket.findUnique({
      where: { trackingToken: token },
      include: { customer: true, workItem: true },
    });

    if (!ticket) {
      throw new NotFoundError('Invalid tracking token');
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Add comment marked as customer-authored
      const comment = await tx.comment.create({
        data: {
          ticketId: ticket.id,
          workItemId: ticket.workItemId,
          customerAuthorId: ticket.customerId,
          isInternal: false,
          body: input.body,
          attachments: input.attachments ? JSON.parse(JSON.stringify(input.attachments)) : undefined,
        },
        include: {
          customerAuthor: { select: { name: true, avatarUrl: true } },
        },
      });

      // 2. If ticket was AWAITING_CUSTOMER, advance status back to IN_PROGRESS
      if (ticket.status === WorkItemStatus.AWAITING_CUSTOMER) {
        await tx.ticket.update({
          where: { id: ticket.id },
          data: { status: WorkItemStatus.IN_PROGRESS },
        });

        if (ticket.workItemId) {
          await tx.workItem.update({
            where: { id: ticket.workItemId },
            data: {
              status: WorkItemStatus.IN_PROGRESS,
              version: { increment: 1 },
            },
          });

          await tx.activityEvent.create({
            data: {
              workItemId: ticket.workItemId,
              action: ActivityAction.STATUS_CHANGED,
              previousState: { status: WorkItemStatus.AWAITING_CUSTOMER },
              newState: { status: WorkItemStatus.IN_PROGRESS },
              metadata: { reason: 'Customer replied to support ticket' },
            },
          });
        }
      }

      return comment;
    });

    return updated;
  }

  /**
   * Customer submits CSAT feedback & resolution confirmation
   */
  async submitCsatFeedback(token: string, input: CsatFeedbackInput) {
    const ticket = await prisma.ticket.findUnique({
      where: { trackingToken: token },
    });

    if (!ticket) {
      throw new NotFoundError('Invalid tracking token');
    }

    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        csatRating: input.rating,
        csatFeedback: input.feedback,
        status: WorkItemStatus.CLOSED,
        closedAt: new Date(),
      },
    });

    if (ticket.workItemId) {
      await prisma.workItem.update({
        where: { id: ticket.workItemId },
        data: {
          status: WorkItemStatus.CLOSED,
          completedAt: new Date(),
          version: { increment: 1 },
        },
      });

      await prisma.activityEvent.create({
        data: {
          workItemId: ticket.workItemId,
          action: ActivityAction.CUSTOMER_CONFIRMED,
          metadata: {
            rating: input.rating,
            feedback: input.feedback,
          },
        },
      });
    }

    return updated;
  }
}

export const ticketsService = new TicketsService();
