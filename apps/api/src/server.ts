import { createApp } from './app';
import { env } from './config/env';
import { logger } from './shared/logger';
import { outboxWorker } from './modules/outbox/outbox.worker';
import { slaService } from './services/sla.service';
import { prisma } from './shared/database';

const app = createApp();

const server = app.listen(env.PORT, env.HOST, () => {
  logger.info(`🚀 [instOS API] Server listening on http://${env.HOST}:${env.PORT}${env.API_PREFIX}`);
  logger.info(`✨ [instOS API] Environment: ${env.NODE_ENV}`);

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
