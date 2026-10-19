import { Router } from 'express';
import { prisma } from '../../shared/database';
import { logger } from '../../shared/logger';
import { sseService } from '../../services/sse.service';
import { slaService } from '../../services/sla.service';
import { WorkItemStatus, Priority, WorkItemType, TicketChannel, ActivityAction } from '@instos/shared';

export const webhooksRouter = Router();

/**
 * POST /api/v1/webhooks/resend
 * Inbound Email Webhook Parser: Automatically converts customer emails into support tickets
 * or appends replies to existing active incident threads.
 */
webhooksRouter.post('/resend', async (req, res, next) => {
  try {
    const payload = req.body || {};
    logger.info('[Webhook:Resend] Received inbound email payload', { payload });

    // Handle both direct webhook formats and Resend event envelope
    const emailData = payload.data || payload;
    const rawFrom = emailData.from || payload.from || '';
    const subject = emailData.subject || payload.subject || 'Inbound Support Request';
    const body = emailData.text || emailData.html || payload.text || payload.body || 'No message content provided.';

    // Extract email and sender name: e.g. "Alex Mercer <alex@example.com>"
    let email = rawFrom;
    let name = 'Customer';
    const match = rawFrom.match(/^(.*?)\s*<([^>]+)>/);
    if (match) {
      name = match[1].replace(/["']/g, '').trim() || 'Customer';
      email = match[2].trim();
    } else {
      email = rawFrom.replace(/["']/g, '').trim();
    }

    if (!email || !email.includes('@')) {
      email = 'customer@external.client';
    }

    // 1. Check if email is replying to an existing ticket: e.g. "Re: [#1004] Payment gateway failure"
    const ticketMatch = subject.match(/(?:#|TICKET-|ticket-)(\d+)/i);
    if (ticketMatch) {
      const ticketNumber = parseInt(ticketMatch[1], 10);
      const existingTicket = await prisma.ticket.findUnique({
        where: { ticketNumber },
        include: {
          customer: true,
          workItem: true,
        },
      });

      if (existingTicket) {
        // Append discussion comment to existing ticket
        const comment = await prisma.comment.create({
          data: {
            ticketId: existingTicket.id,
            workItemId: existingTicket.workItemId,
            customerAuthorId: existingTicket.customerId,
            isInternal: false,
            body: `[Inbound Email Reply from ${email}]\n\n${body}`,
          },
        });

        // Re-open if closed or waiting
        if (
          existingTicket.status === WorkItemStatus.RESOLVED ||
          existingTicket.status === WorkItemStatus.AWAITING_CUSTOMER
        ) {
          await prisma.ticket.update({
            where: { id: existingTicket.id },
            data: { status: WorkItemStatus.IN_PROGRESS },
          });

          if (existingTicket.workItemId) {
            await prisma.workItem.update({
              where: { id: existingTicket.workItemId },
              data: {
                status: WorkItemStatus.IN_PROGRESS,
                version: { increment: 1 },
              },
            });
          }
        }

        // Live broadcast update to all connected operators
        sseService.broadcast('WORK_ITEM_UPDATED', {
          action: 'COMMENT_ADDED',
          workItemId: existingTicket.workItemId,
          ticketNumber: existingTicket.ticketNumber,
          sender: name,
        });

        logger.info(`[Webhook:Resend] Inbound email appended to ticket #${ticketNumber}`);
        return res.json({
          success: true,
          action: 'REPLY_APPENDED',
          ticketNumber,
          commentId: comment.id,
        });
      }
    }

    // 2. Otherwise, create a brand-new Customer & Ticket + linked WorkItem
    const customer = await prisma.customer.upsert({
      where: { email },
      update: { name },
      create: { email, name },
    });

    // Default to Customer Support team
    let supportTeam = await prisma.team.findFirst({ where: { slug: 'support' } });
    if (!supportTeam) {
      supportTeam = await prisma.team.findFirst();
    }
    if (!supportTeam) {
      return res.status(500).json({ success: false, error: 'No operational team configured to receive tickets.' });
    }

    // Default system dispatcher user
    const dispatcher =
      (await prisma.user.findFirst({ where: { email: 'admin@instos.dev' } })) ||
      (await prisma.user.findFirst());

    if (!dispatcher) {
      return res.status(500).json({ success: false, error: 'No dispatcher user found.' });
    }

    const slaDeadline = slaService.calculateSlaDeadline(Priority.MEDIUM);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Ticket
      const newTicket = await tx.ticket.create({
        data: {
          title: subject,
          description: body,
          category: WorkItemType.CUSTOMER_ISSUE,
          priority: Priority.MEDIUM,
          channel: TicketChannel.EMAIL,
          status: WorkItemStatus.OPEN,
          customerId: customer.id,
        },
      });

      // 2. Create linked WorkItem
      const workItem = await tx.workItem.create({
        data: {
          title: `[EMAIL #${newTicket.ticketNumber}] ${subject}`,
          description: `Received via Inbound Email from ${name} (${email})\n\n${body}`,
          type: WorkItemType.CUSTOMER_ISSUE,
          priority: Priority.MEDIUM,
          status: WorkItemStatus.OPEN,
          teamId: supportTeam.id,
          creatorId: dispatcher.id,
          slaDeadline,
        },
      });

      // Link ticket to work item
      await tx.ticket.update({
        where: { id: newTicket.id },
        data: { workItemId: workItem.id },
      });

      // Append immutable activity log
      await tx.activityEvent.create({
        data: {
          workItemId: workItem.id,
          action: ActivityAction.CREATED,
          newState: {
            title: workItem.title,
            priority: workItem.priority,
            status: workItem.status,
            channel: 'EMAIL',
            from: email,
          },
        },
      });

      // Schedule transactional confirmation outbox job
      await tx.outboxJob.create({
        data: {
          aggregateType: 'TICKET',
          aggregateId: newTicket.id,
          eventType: 'TICKET_CREATED_VIA_EMAIL',
          payload: {
            ticketNumber: newTicket.ticketNumber,
            trackingToken: newTicket.trackingToken,
            customerEmail: customer.email,
            customerName: customer.name,
            title: newTicket.title,
          },
        },
      });

      return { ticket: newTicket, workItem };
    });

    // 3. Real-Time Multiplayer SSE Broadcast
    sseService.broadcast('WORK_ITEM_CREATED', {
      workItemId: result.workItem.id,
      ticketNumber: result.ticket.ticketNumber,
      title: result.workItem.title,
      teamName: supportTeam.name,
      priority: Priority.MEDIUM,
    });

    logger.info(`[Webhook:Resend] Created ticket #${result.ticket.ticketNumber} from email ${email}`);

    res.status(201).json({
      success: true,
      action: 'TICKET_CREATED',
      ticketNumber: result.ticket.ticketNumber,
      trackingToken: result.ticket.trackingToken,
      workItemId: result.workItem.id,
    });
  } catch (err) {
    next(err);
  }
});
