import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError, NotFoundError } from '../shared/errors';
import { TeamRole, SystemRole, hasMinimumRole } from '@instos/shared';
import { prisma } from '../shared/database';

export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user || req.user.systemRole !== SystemRole.SUPER_ADMIN) {
    return next(new ForbiddenError('Super Admin privilege required'));
  }
  next();
}

export function requireTeamRole(teamIdParam: string, minimumRole: TeamRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }

    if (req.user.systemRole === SystemRole.SUPER_ADMIN) {
      return next(); // Super admin bypasses per-team gate
    }

    const teamId = req.params[teamIdParam] || req.body[teamIdParam];
    if (!teamId) {
      return next(new ForbiddenError('Target team ID is required'));
    }

    const userRole = req.user.memberships.get(teamId);
    if (!userRole) {
      return next(new NotFoundError('Team not found or access denied'));
    }

    if (!hasMinimumRole(userRole, minimumRole)) {
      return next(
        new ForbiddenError(
          `Action requires minimum role '${minimumRole}', your role in this team is '${userRole}'`
        )
      );
    }

    next();
  };
}

/**
 * Access verification for specific work items.
 * Returns 404 if item does not exist OR if user does not belong to the item's team.
 * (Prevents resource enumeration attacks)
 */
export async function getAccessibleWorkItemOrThrow(user: NonNullable<Request['user']>, itemId: string) {
  const item = await prisma.workItem.findUnique({
    where: { id: itemId },
    include: {
      team: { select: { id: true, name: true, slug: true } },
      assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
      creator: { select: { id: true, name: true, email: true } },
      ticket: {
        include: {
          customer: true,
        },
      },
    },
  });

  if (!item) {
    throw new NotFoundError('Work item not found');
  }

  if (user.systemRole === SystemRole.SUPER_ADMIN) {
    return { item, userRole: TeamRole.ADMIN };
  }

  const userRole = user.memberships.get(item.teamId);
  if (!userRole) {
    // Return 404 to hide cross-team item existence
    throw new NotFoundError('Work item not found');
  }

  return { item, userRole };
}
