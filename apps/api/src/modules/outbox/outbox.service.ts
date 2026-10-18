import { Prisma, OutboxJobStatus } from '@prisma/client';
import { prisma } from '../../shared/database';

export class OutboxService {
  /**
   * Schedule job atomically in the same database transaction as the entity mutation
   */
  async scheduleJob(
    tx: Prisma.TransactionClient,
    job: {
      aggregateType: string;
      aggregateId: string;
      eventType: string;
      payload: Record<string, unknown>;
    }
  ) {
    return tx.outboxJob.create({
      data: {
        aggregateType: job.aggregateType,
        aggregateId: job.aggregateId,
        eventType: job.eventType,
        payload: job.payload as Prisma.InputJsonValue,
        status: OutboxJobStatus.PENDING,
      },
    });
  }

  async getQueueStats() {
    const counts = await prisma.outboxJob.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const stats: Record<string, number> = {
      PENDING: 0,
      PROCESSING: 0,
      COMPLETED: 0,
      FAILED: 0,
      DEAD_LETTER: 0,
    };

    for (const c of counts) {
      stats[c.status] = c._count._all;
    }

    return stats;
  }

  async retryJob(jobId: string) {
    return prisma.outboxJob.update({
      where: { id: jobId },
      data: {
        status: OutboxJobStatus.PENDING,
        attempts: 0,
        nextRetryAt: new Date(),
        lastError: null,
      },
    });
  }
}

export const outboxService = new OutboxService();
