import { Router } from 'express';
import { usersService } from './users.service';
import { CreateUserSchema, TeamRole } from '@instos/shared';
import { authMiddleware } from '../../middleware/auth';
import { requireSuperAdmin } from '../../middleware/rbac';
import { z } from 'zod';

export const usersRouter = Router();

usersRouter.use(authMiddleware);

// List users (Operators can list colleagues to assign items, Admins see full details)
usersRouter.get('/', async (_req, res, next) => {
  try {
    const users = await usersService.listUsers();
    res.json({
      success: true,
      data: users,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

// Super Admin creates new operator account
usersRouter.post('/', requireSuperAdmin, async (req, res, next) => {
  try {
    const input = CreateUserSchema.parse(req.body);
    const created = await usersService.createUser(input);
    res.status(201).json({
      success: true,
      data: created,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

// Super Admin updates/assigns team role dynamically
const UpdateRoleSchema = z.object({
  teamId: z.string().uuid(),
  role: z.nativeEnum(TeamRole),
});

usersRouter.post('/:id/role', requireSuperAdmin, async (req, res, next) => {
  try {
    const { teamId, role } = UpdateRoleSchema.parse(req.body);
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = await usersService.updateUserRoleInTeam(id, teamId, role);
    res.json({
      success: true,
      data: updated,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});
