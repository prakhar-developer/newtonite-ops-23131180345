import { Router } from 'express';
import { teamsService } from './teams.service';
import { CreateTeamSchema } from '@instos/shared';
import { authMiddleware } from '../../middleware/auth';
import { requireSuperAdmin } from '../../middleware/rbac';

export const teamsRouter = Router();

// Public list for widget & intake dropdown
teamsRouter.get('/public', async (_req, res, next) => {
  try {
    const teams = await teamsService.listTeams();
    res.json({
      success: true,
      data: teams.map((t) => ({ id: t.id, name: t.name, slug: t.slug, description: t.description })),
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

// Authenticated teams list
teamsRouter.get('/', authMiddleware, async (_req, res, next) => {
  try {
    const teams = await teamsService.listTeams();
    res.json({
      success: true,
      data: teams,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

// Admin creates new team
teamsRouter.post('/', authMiddleware, requireSuperAdmin, async (req, res, next) => {
  try {
    const input = CreateTeamSchema.parse(req.body);
    const created = await teamsService.createTeam(input);
    res.status(201).json({
      success: true,
      data: created,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});
