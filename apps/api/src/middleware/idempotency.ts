import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../shared/database';
import { ConflictError, BadRequestError } from '../shared/errors';
import { logger } from '../shared/logger';

export const IDEMPOTENCY_HEADER = 'idempotency-key';

function computeRequestHash(req: Request): string {
  const normalized = {
    method: req.method.toUpperCase(),
    path: req.originalUrl ? req.originalUrl.split('?')[0] : req.path,
    body: req.body ?? {},
    userId: req.user?.id || 'anonymous',
  };
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

export async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const rawKey = req.headers[IDEMPOTENCY_HEADER];

  if (!rawKey || typeof rawKey !== 'string') {
    return next();
  }

  const key = rawKey.trim();
  if (key.length === 0 || key.length > 255) {
    return next(new BadRequestError('Idempotency-Key must be between 1 and 255 characters'));
  }

  const requestHash = computeRequestHash(req);
  const userId = req.user?.id || null;

  try {
    const existing = await prisma.idempotencyKey.findUnique({
      where: { key },
    });

    if (existing) {
      // 1. Verify payload hash matches
      if (existing.requestHash !== requestHash) {
        throw new ConflictError(
          'Idempotency key was previously used with a different request payload or endpoint',
          { key, previousMethod: existing.requestMethod, previousPath: existing.requestPath }
        );
      }

      // 2. If resolved, replay cached response
      if (existing.status === 'RESOLVED' && existing.responseBody !== null) {
        logger.info(`[Idempotency] Cache HIT for key: ${key}`);
        res.set('Idempotent-Replay', 'true');
        res.set('X-Cache-Lookup', 'HIT');
        res.set(IDEMPOTENCY_HEADER, key);
        res.status(existing.statusCode || 200).json(existing.responseBody);
        return;
      }

      // 3. If currently processing, reject concurrent duplicate
      if (existing.status === 'PROCESSING') {
        throw new ConflictError('A request with this idempotency key is currently processing. Please wait.', {
          key,
        });
      }
    }

    // 4. Insert new idempotency key with status PROCESSING
    await prisma.idempotencyKey.create({
      data: {
        key,
        userId,
        requestMethod: req.method.toUpperCase(),
        requestPath: req.originalUrl ? req.originalUrl.split('?')[0] : req.path,
        requestHash,
        status: 'PROCESSING',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24-hour TTL
      },
    });

    // 5. Intercept res.json to capture response
    const originalJson = res.json.bind(res);
    res.json = (body: unknown): Response => {
      const statusCode = res.statusCode;

      // Only cache successful status codes (2xx)
      if (statusCode >= 200 && statusCode < 300) {
        prisma.idempotencyKey
          .update({
            where: { key },
            data: {
              status: 'RESOLVED',
              statusCode,
              responseBody: body as object,
            },
          })
          .catch((err) => {
            logger.error(`[Idempotency] Failed to store resolved response for key ${key}`, { err });
          });
      } else {
        // If failed, delete key so user can retry legitimately
        prisma.idempotencyKey.delete({ where: { key } }).catch(() => {});
      }

      res.set(IDEMPOTENCY_HEADER, key);
      return originalJson(body);
    };

    next();
  } catch (err) {
    next(err);
  }
}
