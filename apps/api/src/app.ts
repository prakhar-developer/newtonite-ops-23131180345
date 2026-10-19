import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/error-handler';
import { authRouter } from './modules/auth/auth.router';
import { ticketsRouter } from './modules/tickets/tickets.router';
import { workItemsRouter } from './modules/work-items/work-items.router';
import { teamsRouter } from './modules/teams/teams.router';
import { usersRouter } from './modules/users/users.router';
import { settingsRouter } from './modules/settings/settings.router';
import { notificationsRouter } from './modules/notifications/notifications.router';
import { prisma } from './shared/database';
import { redisManager } from './shared/redis';

export function createApp() {
  const app = express();

  // Basic security and parsing
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(
    cors({
      origin: '*', // Allow Vercel frontend and external website widget origins
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Requested-With'],
      exposedHeaders: ['Idempotency-Key', 'Idempotent-Replay', 'X-Cache-Lookup'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static uploads directory for local fallback
  const uploadsPath = path.resolve(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Root platform status endpoint (Railway / browser initial ping)
  app.get('/', (_req, res) => {
    res.json({
      name: 'instOS Operational Platform API',
      version: '1.0.0',
      status: 'active',
      health: '/health',
      docs: '/api/v1',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/favicon.ico', (_req, res) => {
    res.status(204).end();
  });

  // Health check
  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        redis: redisManager.isAvailable ? 'connected' : (env.REDIS_URL ? 'connecting' : 'in-memory-fallback'),
        integrations: {
          email: env.RESEND_API_KEY ? 'resend-production' : 'ethereal-preview-mode',
          storage: (env.CLOUDINARY_URL || env.CLOUDINARY_CLOUD_NAME) ? 'cloudinary-production' : 'local-disk-fallback',
        },
        uptime: process.uptime(),
      });
    } catch {
      res.status(503).json({
        status: 'degraded',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      });
    }
  });

  // API Routes
  const prefix = env.API_PREFIX;
  app.use(`${prefix}/auth`, authRouter);
  app.use(`${prefix}/tickets`, ticketsRouter);
  app.use(`${prefix}/items`, workItemsRouter);
  app.use(`${prefix}/teams`, teamsRouter);
  app.use(`${prefix}/users`, usersRouter);
  app.use(`${prefix}/settings`, settingsRouter);
  app.use(`${prefix}/notifications`, notificationsRouter);
  // Optional static frontend serve if built dist exists (for Docker & unified container)
  const webDistPath = path.resolve(process.cwd(), 'apps/web/dist');
  try {
    const fs = require('fs');
    if (fs.existsSync(webDistPath)) {
      app.use(express.static(webDistPath));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/uploads')) {
          return next();
        }
        res.sendFile(path.join(webDistPath, 'index.html'));
      });
    }
  } catch {
    // Non-fatal if fs check fails
  }

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
