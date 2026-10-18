import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../apps/api/src/app';
import { prisma } from '../apps/api/src/shared/database';
import jwt from 'jsonwebtoken';
import { env } from '../apps/api/src/config/env';

describe('Critical Behaviour 4: Server-Enforced State Machine & Lead Approval Gate', () => {
  const app = createApp();

  let teamId: string;
  let leadToken: string;
  let memberToken: string;
  let leadId: string;
  let memberId: string;

  beforeAll(async () => {
    const team = await prisma.team.create({
      data: {
        name: `Workflow Team ${Date.now()}`,
        slug: `workflow-${Date.now()}`,
      },
    });
    teamId = team.id;

    // Lead
    const lead = await prisma.user.create({
      data: {
        email: `lead-${Date.now()}@test.com`,
        name: 'Lead User',
        passwordHash: 'dummy',
      },
    });
    leadId = lead.id;
    await prisma.membership.create({
      data: { userId: lead.id, teamId, role: 'LEAD' },
    });
    leadToken = jwt.sign({ sub: lead.id }, env.JWT_SECRET);

    // Member
    const member = await prisma.user.create({
      data: {
        email: `member-${Date.now()}@test.com`,
        name: 'Member User',
        passwordHash: 'dummy',
      },
    });
    memberId = member.id;
    await prisma.membership.create({
      data: { userId: member.id, teamId, role: 'MEMBER' },
    });
    memberToken = jwt.sign({ sub: member.id }, env.JWT_SECRET);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Illegal state jump (OPEN -> RESOLVED) is rejected with 400 Bad Request', async () => {
    const item = await prisma.workItem.create({
      data: {
        title: 'State Jump Item',
        type: 'TASK',
        priority: 'MEDIUM',
        status: 'OPEN',
        teamId,
        creatorId: memberId,
        assigneeId: memberId,
        version: 1,
      },
    });

    const res = await request(app)
      .post(`/api/v1/items/${item.id}/transition`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        version: 1,
        targetStatus: 'RESOLVED', // Illegal jump from OPEN!
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('Approval Gate: Member attempting to approve item from AWAITING_APPROVAL -> 403 Forbidden', async () => {
    const item = await prisma.workItem.create({
      data: {
        title: 'Approval Gate Item',
        type: 'TASK',
        priority: 'HIGH',
        status: 'AWAITING_APPROVAL',
        teamId,
        creatorId: memberId,
        assigneeId: memberId,
        version: 1,
      },
    });

    const res = await request(app)
      .post(`/api/v1/items/${item.id}/transition`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        version: 1,
        targetStatus: 'RESOLVED',
      });

    expect(res.status).toBe(403);
    expect(res.body.error.message).toContain('Approval requires Team Lead or Admin role');
  });

  it('Four-Eyes Rule: Assignee Lead cannot approve their own work item -> 403 Forbidden', async () => {
    // Item assigned to the Lead themselves
    const item = await prisma.workItem.create({
      data: {
        title: 'Self-Assigned Lead Item',
        type: 'INCIDENT',
        priority: 'CRITICAL',
        status: 'AWAITING_APPROVAL',
        teamId,
        creatorId: leadId,
        assigneeId: leadId, // Self-assigned!
        version: 1,
      },
    });

    const res = await request(app)
      .post(`/api/v1/items/${item.id}/transition`)
      .set('Authorization', `Bearer ${leadToken}`)
      .send({
        version: 1,
        targetStatus: 'RESOLVED',
      });

    expect(res.status).toBe(403);
    expect(res.body.error.message).toContain('Four-Eyes Principle Violation');
  });

  it('Valid Lead Approval: Different Lead successfully resolves item in review', async () => {
    // Item assigned to member, reviewed and approved by Lead
    const item = await prisma.workItem.create({
      data: {
        title: 'Properly Approved Item',
        type: 'TASK',
        priority: 'MEDIUM',
        status: 'AWAITING_APPROVAL',
        teamId,
        creatorId: memberId,
        assigneeId: memberId, // Assigned to member!
        version: 1,
      },
    });

    const res = await request(app)
      .post(`/api/v1/items/${item.id}/transition`)
      .set('Authorization', `Bearer ${leadToken}`)
      .send({
        version: 1,
        targetStatus: 'RESOLVED',
        reason: 'Verified and approved',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('RESOLVED');
  });
});
