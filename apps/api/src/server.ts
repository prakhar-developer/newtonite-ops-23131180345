import { createApp } from './app';
import { env } from './config/env';
import { logger } from './shared/logger';
import { outboxWorker } from './modules/outbox/outbox.worker';
import { slaService } from './services/sla.service';
import { prisma } from './shared/database';

const app = createApp();

const primaryPort = Number(process.env.PORT) || env.PORT || 8080;
const host = '0.0.0.0';

const server = app.listen(primaryPort, host, async () => {
  logger.info(`🚀 [instOS API] Server listening on http://${host}:${primaryPort}${env.API_PREFIX}`);
  logger.info(`✨ [instOS API] Environment: ${env.NODE_ENV}`);
  logger.info(`🔍 [instOS API] Health endpoint available at http://${host}:${primaryPort}/health`);

  // Also bind to fallback ports 4000 and 8080 to eliminate Railway proxy target port mismatches
  const fallbackPorts = [4000, 8080, 3000].filter((p) => p !== primaryPort);
  for (const fallbackPort of fallbackPorts) {
    try {
      const extraServer = app.listen(fallbackPort, host, () => {
        logger.info(`[instOS API] Also listening on proxy target port http://${host}:${fallbackPort}`);
      });
      extraServer.on('error', () => {
        // Silently ignore if port is occupied
      });
    } catch {}
  }

  // Verify database connection smoothly without crashing port listener
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('[Prisma] Database connection confirmed.');

    // Auto-seed if database is fresh (0 users)
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      logger.info('[Prisma] Fresh database detected. Auto-seeding initial personas and teams...');
      const { exec } = await import('child_process');
      exec('npx tsx prisma/seed.ts', (error, stdout) => {
        if (error) {
          logger.error(`[Prisma] Seed error: ${error.message}`);
        } else {
          logger.info(`[Prisma] Initial database seed completed successfully.`);
        }
      });
    } else {
      logger.info(`[Prisma] Database contains ${userCount} users. Ready.`);
    }
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
