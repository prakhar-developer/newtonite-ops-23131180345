import bcrypt from 'bcryptjs';
import { prisma } from '../../shared/database';
import type { CreateUserInput } from '@instos/shared';
import { ConflictError, NotFoundError } from '../../shared/errors';
import { TeamRole } from '@instos/shared';

export class UsersService {
  async listUsers() {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        isActive: true,
        systemRole: true,
        createdAt: true,
        memberships: {
          include: {
            team: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  }

  async createUser(input: CreateUserInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email.toLowerCase(),
          passwordHash,
          systemRole: input.systemRole,
        },
      });

      if (input.teamMemberships && input.teamMemberships.length > 0) {
        for (const m of input.teamMemberships) {
          await tx.membership.create({
            data: {
              userId: user.id,
              teamId: m.teamId,
              role: m.role,
            },
          });
        }
      }

      return tx.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          systemRole: true,
          memberships: {
            include: { team: true },
          },
        },
      });
    });
  }

  async updateUserRoleInTeam(userId: string, teamId: string, role: TeamRole) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');

    const membership = await prisma.membership.upsert({
      where: {
        userId_teamId: { userId, teamId },
      },
      update: { role },
      create: { userId, teamId, role },
      include: {
        team: true,
      },
    });

    return membership;
  }
}

export const usersService = new UsersService();
