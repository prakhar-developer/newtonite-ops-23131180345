import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../shared/database';
import { env } from '../../config/env';
import { UnauthorizedError } from '../../shared/errors';
import type { LoginInput } from '@instos/shared';

export class AuthService {
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        memberships: {
          include: {
            team: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        systemRole: user.systemRole,
      },
      env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        systemRole: user.systemRole,
        memberships: user.memberships.map((m) => ({
          teamId: m.teamId,
          teamName: m.team.name,
          teamSlug: m.team.slug,
          role: m.role,
        })),
      },
    };
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            team: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      systemRole: user.systemRole,
      memberships: user.memberships.map((m) => ({
        teamId: m.teamId,
        teamName: m.team.name,
        teamSlug: m.team.slug,
        role: m.role,
      })),
    };
  }
}

export const authService = new AuthService();
