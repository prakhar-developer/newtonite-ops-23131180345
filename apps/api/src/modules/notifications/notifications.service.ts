import { WorkItemStatus, ActivityAction, SystemRole } from '@instos/shared';
import { prisma } from '../../shared/database';

export interface NotificationItem {
  id: string;
  type: 'APPROVAL_REQUIRED' | 'SLA_BREACH' | 'ASSIGNED' | 'TICKET_CREATED' | 'COMMENT';
  title: string;
  message: string;
  workItemId: string;
  workItemTitle: string;
  priority: string;
  status: string;
  teamName: string;
  actor?: {
    name: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  createdAt: string;
  read: boolean;
}

// In-memory read tracking store with timestamp checkpoint
const userReadTimestamps = new Map<string, number>();
const userReadIds = new Map<string, Set<string>>();

export class NotificationsService {
  async getNotificationsForUser(user: { id: string; systemRole: string }): Promise<{ unreadCount: number; notifications: NotificationItem[] }> {
    // 1. Get user's team memberships
    const memberships = await prisma.membership.findMany({
      where: { userId: user.id },
      include: { team: true },
    });

    const isSuperAdmin = user.systemRole === SystemRole.SUPER_ADMIN;
    let teamIds = memberships.map((m) => m.teamId);
    let leadTeamIds = memberships
      .filter((m) => m.role === 'LEAD' || m.role === 'ADMIN')
      .map((m) => m.teamId);

    if (isSuperAdmin) {
      const allTeams = await prisma.team.findMany({ select: { id: true } });
      teamIds = allTeams.map((t) => t.id);
      leadTeamIds = teamIds;
    }

    const rawNotifications: NotificationItem[] = [];

    // 2. Approvals required in lead teams
    if (leadTeamIds.length > 0) {
      const approvalItems = await prisma.workItem.findMany({
        where: {
          teamId: { in: leadTeamIds },
          status: WorkItemStatus.AWAITING_APPROVAL,
        },
        take: 8,
        orderBy: { updatedAt: 'desc' },
        include: { team: { select: { name: true } } },
      });

      for (const item of approvalItems) {
        rawNotifications.push({
          id: `approval_${item.id}`,
          type: 'APPROVAL_REQUIRED',
          title: 'Approval Required',
          message: `Work item "${item.title}" is awaiting lead approval in ${item.team.name}`,
          workItemId: item.id,
          workItemTitle: item.title,
          priority: item.priority,
          status: item.status,
          teamName: item.team.name,
          createdAt: item.updatedAt.toISOString(),
          read: false,
        });
      }
    }

    // 3. Breached SLAs in user's teams
    if (teamIds.length > 0) {
      const breachedItems = await prisma.workItem.findMany({
        where: {
          teamId: { in: teamIds },
          slaBreached: true,
          status: { not: WorkItemStatus.CLOSED },
        },
        take: 8,
        orderBy: { updatedAt: 'desc' },
        include: { team: { select: { name: true } } },
      });

      for (const item of breachedItems) {
        rawNotifications.push({
          id: `sla_${item.id}`,
          type: 'SLA_BREACH',
          title: 'SLA Breached',
          message: `CRITICAL: SLA deadline expired for [${item.priority}] ${item.title}`,
          workItemId: item.id,
          workItemTitle: item.title,
          priority: item.priority,
          status: item.status,
          teamName: item.team.name,
          createdAt: item.updatedAt.toISOString(),
          read: false,
        });
      }
    }

    // 4. Assignments to current user
    const assignmentEvents = await prisma.activityEvent.findMany({
      where: {
        workItem: { assigneeId: user.id },
        action: { in: [ActivityAction.ASSIGNED, ActivityAction.CLAIMED] },
        actorId: { not: user.id },
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        workItem: { include: { team: { select: { name: true } } } },
        actor: { select: { name: true, email: true, avatarUrl: true } },
      },
    });

    for (const event of assignmentEvents) {
      rawNotifications.push({
        id: `assigned_${event.id}`,
        type: 'ASSIGNED',
        title: 'Work Item Assigned',
        message: `${event.actor?.name || 'Dispatcher'} assigned you to "${event.workItem.title}"`,
        workItemId: event.workItemId,
        workItemTitle: event.workItem.title,
        priority: event.workItem.priority,
        status: event.workItem.status,
        teamName: event.workItem.team.name,
        actor: event.actor,
        createdAt: event.createdAt.toISOString(),
        read: false,
      });
    }

    // 5. Customer ticket submissions
    if (teamIds.length > 0) {
      const tickets = await prisma.ticket.findMany({
        where: {
          status: WorkItemStatus.OPEN,
          workItem: { teamId: { in: teamIds } },
        },
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          workItem: { include: { team: { select: { name: true } } } },
          customer: { select: { name: true, company: true } },
        },
      });

      for (const t of tickets) {
        rawNotifications.push({
          id: `ticket_${t.id}`,
          type: 'TICKET_CREATED',
          title: 'Customer Inquiry Received',
          message: `Customer ${t.customer.name} filed ticket #${t.ticketNumber}: "${t.title}"`,
          workItemId: t.workItemId || '',
          workItemTitle: t.title,
          priority: t.priority,
          status: t.status,
          teamName: t.workItem?.team.name || 'Support',
          createdAt: t.createdAt.toISOString(),
          read: false,
        });
      }
    }

    // 6. Discussion comments on user's items
    const comments = await prisma.comment.findMany({
      where: {
        workItem: {
          OR: [{ assigneeId: user.id }, { creatorId: user.id }],
        },
        authorId: { not: user.id },
        isInternal: false,
      },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        workItem: { include: { team: { select: { name: true } } } },
        author: { select: { name: true, email: true, avatarUrl: true } },
      },
    });

    for (const c of comments) {
      rawNotifications.push({
        id: `comment_${c.id}`,
        type: 'COMMENT',
        title: 'New Discussion Message',
        message: `${c.author?.name || 'Client'} commented: "${c.body.slice(0, 60)}${c.body.length > 60 ? '...' : ''}"`,
        workItemId: c.workItemId || '',
        workItemTitle: c.workItem?.title || '',
        priority: c.workItem?.priority || 'MEDIUM',
        status: c.workItem?.status || 'OPEN',
        teamName: c.workItem?.team.name || '',
        actor: c.author,
        createdAt: c.createdAt.toISOString(),
        read: false,
      });
    }

    // Sort by latest first
    rawNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Deduplicate by ID
    const seen = new Set<string>();
    const uniqueNotifications = rawNotifications.filter((n) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });

    // Check read state against user timestamp checkpoint & read ID set
    const userTimestamp = userReadTimestamps.get(user.id) || 0;
    const userSpecificReadIds = userReadIds.get(user.id) || new Set<string>();

    let unreadCount = 0;
    const finalNotifications = uniqueNotifications.slice(0, 25).map((n) => {
      const isRead =
        userSpecificReadIds.has(n.id) ||
        new Date(n.createdAt).getTime() <= userTimestamp;

      if (!isRead) {
        unreadCount++;
      }

      return {
        ...n,
        read: isRead,
      };
    });

    return {
      unreadCount,
      notifications: finalNotifications,
    };
  }

  markAllAsRead(userId: string): void {
    userReadTimestamps.set(userId, Date.now());
  }

  markSingleAsRead(userId: string, notificationId: string): void {
    let set = userReadIds.get(userId);
    if (!set) {
      set = new Set<string>();
      userReadIds.set(userId, set);
    }
    set.add(notificationId);
  }
}

export const notificationsService = new NotificationsService();
