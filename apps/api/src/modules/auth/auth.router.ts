import { Router } from 'express';
import { authService } from './auth.service';
import { LoginSchema } from '@instos/shared';
import { authMiddleware } from '../../middleware/auth';

export const authRouter = Router();

authRouter.post('/login', async (req, res, next) => {
  try {
    const input = LoginSchema.parse(req.body);
    const result = await authService.login(input);
    res.json({
      success: true,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const me = await authService.getMe(req.user!.id);
    res.json({
      success: true,
      data: me,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});
