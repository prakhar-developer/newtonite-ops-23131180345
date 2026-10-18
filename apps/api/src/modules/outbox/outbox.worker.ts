import { OutboxJobStatus, type OutboxJob } from '@prisma/client';
import { prisma } from '../../shared/database';
import { logger } from '../../shared/logger';
import { emailService } from '../../services/email.service';
import { env } from '../../config/env';

export class OutboxWorker {
  private isRunning = false;
  private timer: NodeJS.Timeout | null = null;
  private readonly defaultStaleThresholdMs = env.OUTBOX_STALE_THRESHOLD_MS;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info(`[OutboxWorker] Started background polling daemon (interval: ${env.OUTBOX_POLL_INTERVAL_MS}ms)`);
    this.poll();
  }

  stop() {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    logger.info('[OutboxWorker] Stopped background polling daemon');
  }

  private poll() {
    if (!this.isRunning) return;

    this.processBatch()
      .catch((err) => {
        logger.error('[OutboxWorker] Error during batch processing:', { err });
      })
      .finally(() => {
        if (this.isRunning) {
          this.timer = setTimeout(() => this.poll(), env.OUTBOX_POLL_INTERVAL_MS);
        }
      });
  }

  async processBatch(batchSize = 10): Promise<{ processed: number; succeeded: number; failed: number }> {
    const now = new Date();
    const staleThreshold = new Date(now.getTime() - this.defaultStaleThresholdMs);

    // 1. Fetch pending candidates or stale processing jobs (crashed worker lease recovery)
    const candidates = await prisma.outboxJob.findMany({
      where: {
        OR: [
          {
            status: OutboxJobStatus.PENDING,
            nextRetryAt: { lte: now },
          },
          {
            status: OutboxJobStatus.PROCESSING,
            updatedAt: { lte: staleThreshold },
          },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: batchSize,
    });

    let succeeded = 0;
    let failed = 0;

    for (const candidate of candidates) {
      // 2. Atomic conditional claim: update status to PROCESSING
      const claimResult = await prisma.outboxJob.updateMany({
        where: {
          id: candidate.id,
          status: candidate.status,
          attempts: candidate.attempts,
        },
        data: {
          status: OutboxJobStatus.PROCESSING,
          attempts: { increment: 1 },
          updatedAt: now,
        },
      });

      if (claimResult.count === 0) {
        continue; // Another worker claimed this job
      }

      const job = await prisma.outboxJob.findUnique({ where: { id: candidate.id } });
      if (!job) continue;

      try {
        await this.dispatch(job);

        // Mark as completed
        await prisma.outboxJob.update({
          where: { id: job.id },
          data: {
            status: OutboxJobStatus.COMPLETED,
            processedAt: new Date(),
          },
        });
        succeeded++;
      } catch (err: unknown) {
        failed++;
        const errorMessage = err instanceof Error ? err.message : String(err);
        const nextAttempts = job.attempts;
        const isDeadLetter = nextAttempts >= job.maxAttempts;

        // Exponential backoff: 2^attempts * 1000ms
        const backoffMs = Math.min(Math.pow(2, nextAttempts) * 1000, 60000);
        const nextRetryAt = new Date(Date.now() + backoffMs);

        await prisma.outboxJob.update({
          where: { id: job.id },
          data: {
            status: isDeadLetter ? OutboxJobStatus.DEAD_LETTER : OutboxJobStatus.PENDING,
            nextRetryAt,
            lastError: errorMessage,
          },
        });

        logger.warn(
          `[OutboxWorker] Job ${job.id} failed (attempt ${nextAttempts}/${job.maxAttempts}). ` +
            (isDeadLetter ? 'Marked DEAD_LETTER' : `Retrying at ${nextRetryAt.toISOString()}`),
          { error: errorMessage }
        );
      }
    }

    return { processed: candidates.length, succeeded, failed };
  }

  private async dispatch(job: OutboxJob) {
    const payload = job.payload as Record<string, unknown>;

    switch (job.eventType) {
      case 'TICKET_CREATED': {
        const ticket = payload.ticket as { id: string; ticketNumber: number; title: string; trackingToken: string };
        const customer = payload.customer as { name: string; email: string };
        if (ticket && customer) {
          await emailService.sendTicketCreatedNotification(ticket, customer);
        }
        break;
      }

      case 'TICKET_STATUS_CHANGED': {
        const ticket = payload.ticket as { ticketNumber: number; title: string; trackingToken: string; status: string };
        const customer = payload.customer as { name: string; email: string };
        const note = payload.note as string | undefined;
        if (ticket && customer) {
          await emailService.sendTicketStatusUpdate(ticket, customer, note);
        }
        break;
      }

      case 'WORK_ITEM_ESCALATED': {
        logger.warn(
          `[OutboxWorker:Escalation] Urgent SLA Breach Alert fired for item: ${payload.title} (Priority: ${payload.priority})`
        );
        break;
      }

      default:
        logger.info(`[OutboxWorker] Executed generic event handler for ${job.eventType}`);
    }
  }
}

export const outboxWorker = new OutboxWorker();
