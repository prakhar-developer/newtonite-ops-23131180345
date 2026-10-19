import { Router } from 'express';
import { notificationsService } from './notifications.service';
import { authMiddleware } from '../../middleware/auth';

export const notificationsRouter = Router();

notificationsRouter.use(authMiddleware);

/**
 * GET /api/v1/notifications
 * Retrieves aggregated in-app notifications for authenticated user
 */
notificationsRouter.get('/', async (req, res, next) => {
  try {
    const result = await notificationsService.getNotificationsForUser(req.user!);
    res.json({
      success: true,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/notifications/read
 * Marks all or a specific notification as read
 */
notificationsRouter.post('/read', (req, res) => {
  const { id } = req.body || {};
  if (id && typeof id === 'string') {
    notificationsService.markSingleAsRead(req.user!.id, id);
  } else {
    notificationsService.markAllAsRead(req.user!.id);
  }

  res.json({
    success: true,
    data: { read: true },
    meta: { timestamp: new Date().toISOString() },
  });
});
