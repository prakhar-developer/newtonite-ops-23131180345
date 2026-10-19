import { createApp } from './app';
import { env } from './config/env';
import { logger } from './shared/logger';
import { outboxWorker } from './modules/outbox/outbox.worker';
import { slaService } from './services/sla.service';
import { prisma } from './shared/database';

const app = createApp();

const port = Number(process.env.PORT) || env.PORT || 4000;
const host = '0.0.0.0';

const server = app.listen(port, host, async () => {
  logger.info(`🚀 [instOS API] Server listening on http://${host}:${port}${env.API_PREFIX}`);
  logger.info(`✨ [instOS API] Environment: ${env.NODE_ENV}`);
  logger.info(`🔍 [instOS API] Health endpoint available at http://${host}:${port}/health`);

  // Verify database connection smoothly without crashing port listener
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('[Prisma] Database connection confirmed.');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`[Prisma] Database connection warning: ${msg}. Please ensure DATABASE_URL is set in Railway.`);
  }

  // Start background outbox worker
  outboxWorker.start();

  // Start SLA periodic scanner
  setInterval(() => {
    slaService.scanAndEscalate().catch((err) => {
      logger.error('[SlaScanner] Background scan error:', { err });
    });
  }, env.SLA_POLL_INTERVAL_MS);
});

// Graceful Shutdown
async function shutdown(signal: string) {
  logger.info(`[instOS API] Received ${signal}. Shutting down gracefully...`);
  outboxWorker.stop();

  server.close(async () => {
    logger.info('[instOS API] HTTP server closed');
    await prisma.$disconnect();
    logger.info('[instOS API] Database disconnected');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('[instOS API] Forced termination after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
