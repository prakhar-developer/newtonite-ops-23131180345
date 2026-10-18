import { Priority, SLA_DURATIONS_MINUTES, WorkItemStatus, ActivityAction } from '@instos/shared';
import { prisma } from '../shared/database';
import { logger } from '../shared/logger';

export class SlaService {
  /**
   * Calculates the deterministic target SLA deadline
   */
  calculateSlaDeadline(priority: Priority, createdAt = new Date(), customDueDate?: Date | null): Date {
    const durationMinutes = SLA_DURATIONS_MINUTES[priority] || SLA_DURATIONS_MINUTES.MEDIUM;
    const slaTarget = new Date(createdAt.getTime() + durationMinutes * 60 * 1000);

    if (customDueDate && customDueDate < slaTarget) {
      return customDueDate;
    }
    return slaTarget;
  }

  /**
   * Periodic scan to detect approaching breaches and trigger automatic escalations
   */
  async scanAndEscalate(): Promise<{ breachedCount: number }> {
    const now = new Date();

    // Query non-terminal items that crossed SLA deadline but haven't been marked breached
    const breachedCandidates = await prisma.workItem.findMany({
      where: {
        slaBreached: false,
        slaDeadline: { lte: now },
        status: {
          in: [
            WorkItemStatus.OPEN,
            WorkItemStatus.IN_PROGRESS,
            WorkItemStatus.AWAITING_APPROVAL,
            WorkItemStatus.AWAITING_CUSTOMER,
          ],
        },
      },
      include: {
        team: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    let breachedCount = 0;

    for (const item of breachedCandidates) {
      try {
        await prisma.$transaction(async (tx) => {
          // 1. Atomic conditional update to prevent double escalation
          const updated = await tx.workItem.updateMany({
            where: {
              id: item.id,
              slaBreached: false,
            },
            data: {
              slaBreached: true,
              version: { increment: 1 },
            },
          });

          if (updated.count === 0) return;

          // 2. Append immutable audit activity
          await tx.activityEvent.create({
            data: {
              workItemId: item.id,
              action: ActivityAction.ESCALATED,
              newState: { slaBreached: true, breachedAt: now.toISOString() },
              metadata: {
                reason: `SLA Deadline expired for priority ${item.priority}`,
                targetDeadline: item.slaDeadline?.toISOString(),
              },
            },
          });

          // 3. Queue Outbox Job for notifications
          await tx.outboxJob.create({
            data: {
              aggregateType: 'WORK_ITEM',
              aggregateId: item.id,
              eventType: 'WORK_ITEM_ESCALATED',
              payload: {
                workItemId: item.id,
                title: item.title,
                priority: item.priority,
                teamId: item.teamId,
                teamName: item.team.name,
                assigneeName: item.assignee?.name,
                assigneeEmail: item.assignee?.email,
                slaDeadline: item.slaDeadline?.toISOString(),
              },
            },
          });

          breachedCount++;
        });
      } catch (err) {
        logger.error(`[SlaService] Failed to escalate work item ${item.id}`, { err });
      }
    }

    if (breachedCount > 0) {
      logger.warn(`[SlaService] SLA Scanner marked ${breachedCount} items as BREACHED/ESCALATED`);
    }

    return { breachedCount };
  }
}

export const slaService = new SlaService();
