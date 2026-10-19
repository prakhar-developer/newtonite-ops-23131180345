import { Router } from 'express';
import { analyticsService } from './analytics.service';
import { authMiddleware } from '../../middleware/auth';

export const analyticsRouter = Router();

analyticsRouter.use(authMiddleware);

/**
 * GET /api/v1/analytics/overview
 * Real-time operational intelligence, MTTR, SLA compliance rates, and team throughput
 */
analyticsRouter.get('/overview', async (_req, res, next) => {
  try {
    const data = await analyticsService.getOverview();
    res.json({
      success: true,
      data,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});
