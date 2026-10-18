import { prisma } from '../../shared/database';
import type { CreateTeamInput } from '@instos/shared';
import { ConflictError } from '../../shared/errors';

export class TeamsService {
  async listTeams() {
    return prisma.team.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            memberships: true,
            workItems: true,
          },
        },
      },
    });
  }

  async createTeam(input: CreateTeamInput) {
    const existing = await prisma.team.findFirst({
      where: {
        OR: [{ name: input.name }, { slug: input.slug }],
      },
    });

    if (existing) {
      throw new ConflictError('A team with this name or slug already exists');
    }

    return prisma.team.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
      },
    });
  }
}

export const teamsService = new TeamsService();
