import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../apps/api/src/app';
import { prisma } from '../apps/api/src/shared/database';
import jwt from 'jsonwebtoken';
import { env } from '../apps/api/src/config/env';

describe('Critical Behaviour 5: Multi-Team Resource-Level Authorization (RBAC)', () => {
  const app = createApp();

  let teamAId: string;
  let teamBId: string;
  let userAToken: string;
  let viewerAToken: string;
  let userBToken: string;

  beforeAll(async () => {
    // Team A
    const teamA = await prisma.team.create({
      data: { name: `Team A ${Date.now()}`, slug: `team-a-${Date.now()}` },
    });
    teamAId = teamA.id;

    // Team B
    const teamB = await prisma.team.create({
      data: { name: `Team B ${Date.now()}`, slug: `team-b-${Date.now()}` },
    });
    teamBId = teamB.id;

    // User A in Team A (Member)
    const uA = await prisma.user.create({
      data: { email: `ua-${Date.now()}@test.com`, name: 'User A', passwordHash: 'dummy' },
    });
    await prisma.membership.create({ data: { userId: uA.id, teamId: teamAId, role: 'MEMBER' } });
    userAToken = jwt.sign({ sub: uA.id }, env.JWT_SECRET);

    // Viewer in Team A (Viewer only)
    const vA = await prisma.user.create({
      data: { email: `va-${Date.now()}@test.com`, name: 'Viewer A', passwordHash: 'dummy' },
    });
    await prisma.membership.create({ data: { userId: vA.id, teamId: teamAId, role: 'VIEWER' } });
    viewerAToken = jwt.sign({ sub: vA.id }, env.JWT_SECRET);

    // User B in Team B (Member)
    const uB = await prisma.user.create({
      data: { email: `ub-${Date.now()}@test.com`, name: 'User B', passwordHash: 'dummy' },
    });
    await prisma.membership.create({ data: { userId: uB.id, teamId: teamBId, role: 'MEMBER' } });
    userBToken = jwt.sign({ sub: uB.id }, env.JWT_SECRET);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Cross-team isolation: User B probing Team A work item receives 404 Not Found (no entity enumeration)', async () => {
    // Create item in Team A
    const itemA = await prisma.workItem.create({
      data: {
        title: 'Confidential Team A Work Item',
        type: 'COMPLIANCE',
        priority: 'CRITICAL',
        status: 'OPEN',
        teamId: teamAId,
        creatorId: (await prisma.user.findFirstOrThrow()).id,
      },
    });

    // User B attempts to read item in Team A
    const res = await request(app)
      .get(`/api/v1/items/${itemA.id}`)
      .set('Authorization', `Bearer ${userBToken}`);

    // Must return 404 to hide resource existence!
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('Viewer Role: Viewer can read team item, but receives 403 Forbidden on mutations (claim/edit)', async () => {
    const itemA = await prisma.workItem.create({
      data: {
        title: 'Team A Item for Viewer Check',
        type: 'TASK',
        priority: 'LOW',
        status: 'OPEN',
        teamId: teamAId,
        creatorId: (await prisma.user.findFirstOrThrow()).id,
      },
    });

    // 1. Viewer can read (200)
    const readRes = await request(app)
      .get(`/api/v1/items/${itemA.id}`)
      .set('Authorization', `Bearer ${viewerAToken}`);
    expect(readRes.status).toBe(200);

    // 2. Viewer attempting to claim item receives 403 Forbidden
    const claimRes = await request(app)
      .post(`/api/v1/items/${itemA.id}/claim`)
      .set('Authorization', `Bearer ${viewerAToken}`);
    expect(claimRes.status).toBe(403);
    expect(claimRes.body.error.code).toBe('FORBIDDEN');
  });
});
