import { Router } from 'express';
import { settingsService } from './settings.service';
import { authMiddleware } from '../../middleware/auth';
import { requireSuperAdmin } from '../../middleware/rbac';

export const settingsRouter = Router();

// Public branding for external widgets & portals
settingsRouter.get('/branding', async (_req, res, next) => {
  try {
    const branding = await settingsService.getPublicBranding();
    res.json({
      success: true,
      data: branding,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

settingsRouter.use(authMiddleware);

// Admin updates branding
settingsRouter.post('/branding', requireSuperAdmin, async (req, res, next) => {
  try {
    const updated = await settingsService.updateSetting('branding', 'branding', req.body, req.user!.id);
    res.json({
      success: true,
      data: updated,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

// Admin views Outbox queue stats
settingsRouter.get('/outbox/stats', requireSuperAdmin, async (_req, res, next) => {
  try {
    const stats = await settingsService.getOutboxStats();
    const recent = await settingsService.getRecentOutboxJobs();
    res.json({
      success: true,
      data: { stats, recent },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

// Admin retries failed/dead-letter outbox job
settingsRouter.post('/outbox/retry/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const retried = await settingsService.retryJob(id);
    res.json({
      success: true,
      data: retried,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});
