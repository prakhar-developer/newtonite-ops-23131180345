import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../shared/database';
import { UnauthorizedError } from '../shared/errors';
import { TeamRole, SystemRole } from '@instos/shared';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  systemRole: SystemRole;
  memberships: Map<string, TeamRole>; // teamId -> TeamRole
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Bearer token is required'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        memberships: {
          select: {
            teamId: true,
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return next(new UnauthorizedError('User account not found or inactive'));
    }

    const membershipsMap = new Map<string, TeamRole>();
    for (const m of user.memberships) {
      membershipsMap.set(m.teamId, m.role as TeamRole);
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      systemRole: user.systemRole as SystemRole,
      memberships: membershipsMap,
    };

    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
