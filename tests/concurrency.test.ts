import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../apps/api/src/app';
import { prisma } from '../apps/api/src/shared/database';
import jwt from 'jsonwebtoken';
import { env } from '../apps/api/src/config/env';

describe('Critical Behaviour 1 & 2: Concurrency & Optimistic Locking', () => {
  const app = createApp();

  let teamId: string;
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;

  beforeAll(async () => {
    // Provision test team and users
    const team = await prisma.team.create({
      data: {
        name: `Test Team ${Date.now()}`,
        slug: `test-team-${Date.now()}`,
      },
    });
    teamId = team.id;

    const u1 = await prisma.user.create({
      data: {
        email: `u1-${Date.now()}@test.com`,
        name: 'User One',
        passwordHash: 'dummy',
      },
    });
    user1Id = u1.id;
    await prisma.membership.create({
      data: { userId: u1.id, teamId, role: 'MEMBER' },
    });
    user1Token = jwt.sign({ sub: u1.id }, env.JWT_SECRET);

    const u2 = await prisma.user.create({
      data: {
        email: `u2-${Date.now()}@test.com`,
        name: 'User Two',
        passwordHash: 'dummy',
      },
    });
    user2Id = u2.id;
    await prisma.membership.create({
      data: { userId: u2.id, teamId, role: 'MEMBER' },
    });
    user2Token = jwt.sign({ sub: u2.id }, env.JWT_SECRET);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Concurrent claims: Two operators attempt to claim unassigned item in parallel -> Exactly one succeeds, one gets 409 Conflict', async () => {
    // 1. Create unassigned work item
    const item = await prisma.workItem.create({
      data: {
        title: 'Concurrent Race Item',
        type: 'INCIDENT',
        priority: 'CRITICAL',
        status: 'OPEN',
        teamId,
        creatorId: user1Id,
        assigneeId: null,
      },
    });

    // 2. Fire two claims in parallel simultaneously
    const [res1, res2] = await Promise.all([
      request(app)
        .post(`/api/v1/items/${item.id}/claim`)
        .set('Authorization', `Bearer ${user1Token}`),
      request(app)
        .post(`/api/v1/items/${item.id}/claim`)
        .set('Authorization', `Bearer ${user2Token}`),
    ]);

    const statuses = [res1.status, res2.status].sort();
    // Exactly one winner (200), exactly one collision (409)
    expect(statuses).toEqual([200, 409]);

    // Verify database state: assigned to exactly one operator
    const fresh = await prisma.workItem.findUnique({ where: { id: item.id } });
    expect(fresh?.assigneeId).not.toBeNull();
    expect([user1Id, user2Id]).toContain(fresh?.assigneeId);
  });

  it('Optimistic Locking: Stale version update is rejected with 409 Conflict', async () => {
    // 1. Create item at version 1
    const item = await prisma.workItem.create({
      data: {
        title: 'Original Title',
        type: 'TASK',
        priority: 'MEDIUM',
        status: 'OPEN',
        teamId,
        creatorId: user1Id,
        version: 1,
      },
    });

    // 2. User 1 updates item to version 2
    const update1 = await request(app)
      .patch(`/api/v1/items/${item.id}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        version: 1,
        title: 'Updated by User 1',
      });
    expect(update1.status).toBe(200);

    // 3. User 2 submits update with stale version 1
    const update2 = await request(app)
      .patch(`/api/v1/items/${item.id}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        version: 1, // Stale! Current version is now 2
        title: 'Stale Edit by User 2',
      });

    expect(update2.status).toBe(409);
    expect(update2.body.error.code).toBe('CONFLICT');
    expect(update2.body.error.details.currentVersion).toBe(2);
    expect(update2.body.error.details.submittedVersion).toBe(1);
  });
});
