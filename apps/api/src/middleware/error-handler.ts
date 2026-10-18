import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors';
import { logger } from '../shared/logger';
import { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request payload validation failed',
        details: err.errors,
      },
    });
    return;
  }

  const errorMsg = err instanceof Error ? err.message : 'Internal Server Error';
  logger.error('[ErrorHandler] Unhandled exception:', { err });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: errorMsg,
    },
  });
}
