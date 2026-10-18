import { prisma } from '../../shared/database';
import { outboxService } from '../outbox/outbox.service';
import { getAccessibleWorkItemOrThrow } from '../../middleware/rbac';
import {
  type AuthenticatedUser,
} from '../../middleware/auth';
import {
  type CreateWorkItemInput,
  type UpdateWorkItemInput,
  type TransitionWorkItemInput,
  type AddCommentInput,
  WorkItemStatus,
  Priority,
  WorkItemType,
  TeamRole,
  SystemRole,
  ActivityAction,
  ALLOWED_TRANSITIONS,
  hasMinimumRole,
} from '@instos/shared';
import {
  ConflictError,
  ForbiddenError,
  BadRequestError,
} from '../../shared/errors';
import { slaService } from '../../services/sla.service';

export interface WorkItemListQuery {
  view?: 'all' | 'assigned_to_me' | 'unassigned_urgent' | 'awaiting_approval';
  teamId?: string;
  status?: WorkItemStatus;
  priority?: Priority;
  type?: WorkItemType;
  assigneeId?: string;
  slaBreached?: boolean;
  q?: string;
  cursor?: string;
  limit?: number;
}

export class WorkItemsService {
  private encodeCursor(item: { createdAt: Date; id: string }): string {
    return Buffer.from(JSON.stringify({ createdAt: item.createdAt.toISOString(), id: item.id })).toString('base64url');
  }

  private decodeCursor(cursorStr?: string): { createdAt: Date; id: string } | null {
    if (!cursorStr) return null;
    try {
      const decoded = Buffer.from(cursorStr, 'base64url').toString('utf8');
      const parsed = JSON.parse(decoded);
      return { createdAt: new Date(parsed.createdAt), id: parsed.id };
    } catch {
      return null;
    }
  }

  /**
   * List accessible work items with server-side filters and keyset cursor pagination
   */
  async listWorkItems(user: AuthenticatedUser, query: WorkItemListQuery) {
    const limit = Math.min(query.limit || 20, 50);

    // Determine teams user has access to
    let targetTeamIds: string[];
    if (user.systemRole === SystemRole.SUPER_ADMIN) {
      if (query.teamId) {
        targetTeamIds = [query.teamId];
      } else {
        const teams = await prisma.team.findMany({ select: { id: true } });
        targetTeamIds = teams.map((t) => t.id);
      }
    } else {
      const userTeams = Array.from(user.memberships.keys());
      if (userTeams.length === 0) {
        return { items: [], nextCursor: null, hasMore: false, totalCount: 0 };
      }
      targetTeamIds = query.teamId && userTeams.includes(query.teamId) ? [query.teamId] : userTeams;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      teamId: { in: targetTeamIds },
    };

    // Apply Views
    if (query.view === 'assigned_to_me') {
      where.assigneeId = user.id;
    } else if (query.view === 'unassigned_urgent') {
      where.assigneeId = null;
      where.priority = { in: [Priority.CRITICAL, Priority.URGENT] };
    } else if (query.view === 'awaiting_approval') {
      where.status = WorkItemStatus.AWAITING_APPROVAL;
    }

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.type) where.type = query.type;
    if (query.assigneeId) where.assigneeId = query.assigneeId;
    if (query.slaBreached !== undefined) where.slaBreached = query.slaBreached;

    if (query.q && query.q.trim() !== '') {
      where.OR = [
        { title: { contains: query.q.trim(), mode: 'insensitive' } },
        { description: { contains: query.q.trim(), mode: 'insensitive' } },
      ];
    }

    // Keyset Cursor Pagination on (createdAt, id)
    const cursorObj = this.decodeCursor(query.cursor);
    if (cursorObj) {
      where.OR = [
        { createdAt: { lt: cursorObj.createdAt } },
        {
          createdAt: cursorObj.createdAt,
          id: { lt: cursorObj.id },
        },
      ];
    }

    const items = await prisma.workItem.findMany({
      where,
      take: limit + 1,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        team: { select: { id: true, name: true, slug: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, email: true } },
        ticket: {
          select: {
            ticketNumber: true,
            trackingToken: true,
            channel: true,
            customer: { select: { name: true, email: true, company: true } },
          },
        },
      },
    });

    const hasMore = items.length > limit;
    const pagedItems = hasMore ? items.slice(0, limit) : items;
    const nextCursor =
      hasMore && pagedItems.length > 0
        ? this.encodeCursor(pagedItems[pagedItems.length - 1])
        : null;

    return {
      items: pagedItems,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Get single work item with calculated user permissions
   */
  async getWorkItemById(user: AuthenticatedUser, itemId: string) {
    const { item, userRole } = await getAccessibleWorkItemOrThrow(user, itemId);

    const isAssignee = item.assigneeId === user.id;
    const isLeadOrAdmin = hasMinimumRole(userRole, TeamRole.LEAD);
    const isMemberOrAbove = hasMinimumRole(userRole, TeamRole.MEMBER);

    const permissions = {
      canClaim: isMemberOrAbove && item.assigneeId === null,
      canEdit: isMemberOrAbove && (isAssignee || isLeadOrAdmin),
      canTransition: isMemberOrAbove && (isAssignee || isLeadOrAdmin),
      canApprove: isLeadOrAdmin && !isAssignee, // Four-eyes principle: cannot approve own work!
      canAddComment: isMemberOrAbove,
      canViewInternalNotes: isMemberOrAbove,
    };

    const activities = await prisma.activityEvent.findMany({
      where: { workItemId: itemId },
      orderBy: { createdAt: 'desc' },
      include: {
        actor: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      take: 50,
    });

    const comments = await prisma.comment.findMany({
      where: { workItemId: itemId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true, email: true, avatarUrl: true } },
        customerAuthor: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });

    return {
      ...item,
      activities,
      comments,
      permissions,
      userRole,
    };
  }

  /**
   * Create work item internally
   */
  async createWorkItem(user: AuthenticatedUser, input: CreateWorkItemInput) {
    const userRole = user.memberships.get(input.teamId);
    if (user.systemRole !== SystemRole.SUPER_ADMIN && (!userRole || !hasMinimumRole(userRole, TeamRole.MEMBER))) {
      throw new ForbiddenError('You must be a member of the designated team to create work items');
    }

    const slaDeadline = slaService.calculateSlaDeadline(
      input.priority,
      new Date(),
      input.dueDate ? new Date(input.dueDate) : null
    );

    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.workItem.create({
        data: {
          title: input.title,
          description: input.description,
          type: input.type,
          priority: input.priority,
          status: WorkItemStatus.OPEN,
          teamId: input.teamId,
          creatorId: user.id,
          assigneeId: input.assigneeId || null,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          slaDeadline,
        },
        include: {
          team: { select: { id: true, name: true, slug: true } },
          assignee: { select: { id: true, name: true } },
        },
      });

      await tx.activityEvent.create({
        data: {
          workItemId: created.id,
          actorId: user.id,
          action: ActivityAction.CREATED,
          newState: {
            title: created.title,
            priority: created.priority,
            status: created.status,
            type: created.type,
          },
        },
      });

      return created;
    });

    return item;
  }

  /**
   * Critical Behaviour 1: Atomic Claim with Race-Condition Proof Lock
   * Conditional update: UPDATE work_items SET assigneeId = user.id WHERE id = itemId AND assigneeId IS NULL
   */
  async claimWorkItem(user: AuthenticatedUser, itemId: string) {
    const { item, userRole } = await getAccessibleWorkItemOrThrow(user, itemId);

    if (!hasMinimumRole(userRole, TeamRole.MEMBER)) {
      throw new ForbiddenError('Viewers do not have permission to claim work items');
    }

    if (item.assigneeId !== null) {
      throw new ConflictError(
        `Work item is already claimed by ${item.assignee?.name || 'another team member'}`,
        { currentAssignee: item.assignee?.name, currentVersion: item.version }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Atomic Conditional Update
      const claimResult = await tx.workItem.updateMany({
        where: {
          id: itemId,
          assigneeId: null, // Strictly ensure unassigned
        },
        data: {
          assigneeId: user.id,
          status: item.status === WorkItemStatus.OPEN ? WorkItemStatus.IN_PROGRESS : item.status,
          version: { increment: 1 },
        },
      });

      // 2. If count is 0, someone claimed it in parallel!
      if (claimResult.count === 0) {
        const fresh = await tx.workItem.findUnique({
          where: { id: itemId },
          include: { assignee: { select: { name: true } } },
        });
        throw new ConflictError(
          `Claim conflict: Work item was just claimed by ${fresh?.assignee?.name || 'another operator'}`,
          { currentAssignee: fresh?.assignee?.name, currentVersion: fresh?.version }
        );
      }

      // 3. Append Activity Event
      await tx.activityEvent.create({
        data: {
          workItemId: itemId,
          actorId: user.id,
          action: ActivityAction.CLAIMED,
          previousState: { assigneeId: null, status: item.status },
          newState: {
            assigneeId: user.id,
            status: item.status === WorkItemStatus.OPEN ? WorkItemStatus.IN_PROGRESS : item.status,
          },
        },
      });

      // 4. Update linked ticket if present
      if (item.ticket) {
        await tx.ticket.update({
          where: { id: item.ticket.id },
          data: { status: WorkItemStatus.IN_PROGRESS },
        });
      }

      return tx.workItem.findUniqueOrThrow({
        where: { id: itemId },
        include: {
          team: true,
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });
    });

    return updated;
  }

  /**
   * Critical Behaviour 2: Optimistic Locking for Stale Updates
   * Uses integer `version` field. Mismatch returns 409 Conflict with fresh snapshot.
   */
  async updateWorkItem(user: AuthenticatedUser, itemId: string, input: UpdateWorkItemInput) {
    const { item, userRole } = await getAccessibleWorkItemOrThrow(user, itemId);

    if (!hasMinimumRole(userRole, TeamRole.MEMBER)) {
      throw new ForbiddenError('Viewers do not have permission to edit work items');
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Conditional CAS update on version
      const updateResult = await tx.workItem.updateMany({
        where: {
          id: itemId,
          version: input.version,
        },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.priority !== undefined ? { priority: input.priority } : {}),
          ...(input.dueDate !== undefined ? { dueDate: input.dueDate ? new Date(input.dueDate) : null } : {}),
          ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        const latest = await tx.workItem.findUnique({
          where: { id: itemId },
          select: { version: true, title: true, status: true, priority: true, updatedAt: true },
        });
        throw new ConflictError(
          `Stale update rejected: Work item has been modified by another operator (current version: ${latest?.version}, submitted: ${input.version})`,
          {
            currentVersion: latest?.version,
            submittedVersion: input.version,
            latestItem: latest,
          }
        );
      }

      await tx.activityEvent.create({
        data: {
          workItemId: itemId,
          actorId: user.id,
          action: ActivityAction.UPDATED,
          previousState: {
            title: item.title,
            priority: item.priority,
            assigneeId: item.assigneeId,
          },
          newState: {
            title: input.title ?? item.title,
            priority: input.priority ?? item.priority,
            assigneeId: input.assigneeId ?? item.assigneeId,
          },
        },
      });

      return tx.workItem.findUniqueOrThrow({
        where: { id: itemId },
        include: {
          team: true,
          assignee: { select: { id: true, name: true, email: true } },
        },
      });
    });

    return updated;
  }

  /**
   * Critical Behaviour 4: Server-Enforced State Machine & Lead Approval Gate
   */
  async transitionWorkItem(user: AuthenticatedUser, itemId: string, input: TransitionWorkItemInput) {
    const { item, userRole } = await getAccessibleWorkItemOrThrow(user, itemId);

    if (!hasMinimumRole(userRole, TeamRole.MEMBER)) {
      throw new ForbiddenError('Viewers do not have permission to transition work items');
    }

    const currentStatus = item.status;
    const targetStatus = input.targetStatus;

    if (currentStatus === targetStatus) {
      throw new BadRequestError(`Work item is already in status '${currentStatus}'`);
    }

    // Validate transition against allowed matrix
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestError(
        `Invalid workflow jump from '${currentStatus}' to '${targetStatus}'. Allowed transitions: [${allowed.join(', ')}]`
      );
    }

    // Four-Eyes Approval Rule: Transitioning from AWAITING_APPROVAL to RESOLVED requires Lead/Admin
    // AND assignee cannot approve their own work!
    const isApprovalGate = currentStatus === WorkItemStatus.AWAITING_APPROVAL && targetStatus === WorkItemStatus.RESOLVED;
    if (isApprovalGate) {
      if (!hasMinimumRole(userRole, TeamRole.LEAD)) {
        throw new ForbiddenError('Approval requires Team Lead or Admin role. Members cannot approve items.');
      }
      if (item.assigneeId === user.id) {
        throw new ForbiddenError(
          'Four-Eyes Principle Violation: You cannot approve your own work item. Another Lead must review and approve.'
        );
      }
    }

    // Reopening requires Lead or Admin
    if (currentStatus === WorkItemStatus.CLOSED && !hasMinimumRole(userRole, TeamRole.LEAD)) {
      throw new ForbiddenError('Only Team Leads or Admins can reopen closed work items');
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Optimistic CAS on version
      const updateResult = await tx.workItem.updateMany({
        where: {
          id: itemId,
          version: input.version,
        },
        data: {
          status: targetStatus,
          completedAt: targetStatus === WorkItemStatus.RESOLVED || targetStatus === WorkItemStatus.CLOSED ? new Date() : null,
          version: { increment: 1 },
        },
      });

      if (updateResult.count === 0) {
        const latest = await tx.workItem.findUnique({ where: { id: itemId } });
        throw new ConflictError(
          `Transition conflict: Item status was altered concurrently (current version: ${latest?.version}, submitted: ${input.version})`,
          { currentVersion: latest?.version, submittedVersion: input.version }
        );
      }

      // Record Activity
      await tx.activityEvent.create({
        data: {
          workItemId: itemId,
          actorId: user.id,
          action: isApprovalGate ? ActivityAction.WORKFLOW_APPROVED : ActivityAction.STATUS_CHANGED,
          previousState: { status: currentStatus },
          newState: { status: targetStatus },
          metadata: input.reason ? { reason: input.reason } : undefined,
        },
      });

      // Sync linked customer ticket and fire Outbox notification
      if (item.ticket) {
        await tx.ticket.update({
          where: { id: item.ticket.id },
          data: {
            status: targetStatus,
            resolvedAt: targetStatus === WorkItemStatus.RESOLVED ? new Date() : undefined,
            closedAt: targetStatus === WorkItemStatus.CLOSED ? new Date() : undefined,
          },
        });

        // Trigger transactional email to customer
        await outboxService.scheduleJob(tx, {
          aggregateType: 'TICKET',
          aggregateId: item.ticket.id,
          eventType: 'TICKET_STATUS_CHANGED',
          payload: {
            ticket: {
              id: item.ticket.id,
              ticketNumber: item.ticket.ticketNumber,
              title: item.ticket.title,
              trackingToken: item.ticket.trackingToken,
              status: targetStatus,
            },
            customer: {
              name: item.ticket.customer.name,
              email: item.ticket.customer.email,
            },
            note: input.reason,
          },
        });
      }

      return tx.workItem.findUniqueOrThrow({
        where: { id: itemId },
        include: {
          team: true,
          assignee: { select: { id: true, name: true, email: true } },
        },
      });
    });

    return updated;
  }

  /**
   * Add internal note or public operator reply
   */
  async addComment(user: AuthenticatedUser, itemId: string, input: AddCommentInput) {
    const { item, userRole } = await getAccessibleWorkItemOrThrow(user, itemId);

    if (!hasMinimumRole(userRole, TeamRole.MEMBER)) {
      throw new ForbiddenError('Viewers do not have permission to post comments');
    }

    const comment = await prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: {
          workItemId: itemId,
          ticketId: item.ticket?.id || null,
          authorId: user.id,
          isInternal: input.isInternal,
          body: input.body,
          attachments: input.attachments ? JSON.parse(JSON.stringify(input.attachments)) : undefined,
        },
        include: {
          author: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });

      await tx.activityEvent.create({
        data: {
          workItemId: itemId,
          actorId: user.id,
          action: input.isInternal ? ActivityAction.INTERNAL_NOTE_ADDED : ActivityAction.COMMENT_ADDED,
          metadata: {
            isInternal: input.isInternal,
            snippet: input.body.substring(0, 80),
          },
        },
      });

      return created;
    });

    return comment;
  }

  /**
   * Dashboard KPI statistics (Optimized count aggregates)
   */
  async getDashboardKpis(user: AuthenticatedUser) {
    let targetTeamIds: string[];
    if (user.systemRole === SystemRole.SUPER_ADMIN) {
      const teams = await prisma.team.findMany({ select: { id: true } });
      targetTeamIds = teams.map((t) => t.id);
    } else {
      targetTeamIds = Array.from(user.memberships.keys());
    }

    if (targetTeamIds.length === 0) {
      return {
        totalItems: 0,
        assignedToMe: 0,
        unassignedUrgent: 0,
        awaitingApproval: 0,
        slaBreached: 0,
        activeCustomers: 0,
        avgCsat: 4.8,
      };
    }

    const [totalItems, assignedToMe, unassignedUrgent, awaitingApproval, slaBreached, activeCustomers, csatAgg] =
      await Promise.all([
        prisma.workItem.count({ where: { teamId: { in: targetTeamIds } } }),
        prisma.workItem.count({ where: { teamId: { in: targetTeamIds }, assigneeId: user.id, status: { not: WorkItemStatus.CLOSED } } }),
        prisma.workItem.count({
          where: {
            teamId: { in: targetTeamIds },
            assigneeId: null,
            priority: { in: [Priority.CRITICAL, Priority.URGENT] },
            status: { not: WorkItemStatus.CLOSED },
          },
        }),
        prisma.workItem.count({
          where: { teamId: { in: targetTeamIds }, status: WorkItemStatus.AWAITING_APPROVAL },
        }),
        prisma.workItem.count({
          where: { teamId: { in: targetTeamIds }, slaBreached: true, status: { not: WorkItemStatus.CLOSED } },
        }),
        prisma.customer.count(),
        prisma.ticket.aggregate({
          where: { csatRating: { not: null } },
          _avg: { csatRating: true },
        }),
      ]);

    return {
      totalItems,
      assignedToMe,
      unassignedUrgent,
      awaitingApproval,
      slaBreached,
      activeCustomers,
      avgCsat: Number((csatAgg._avg.csatRating || 4.7).toFixed(1)),
    };
  }
}

export const workItemsService = new WorkItemsService();
