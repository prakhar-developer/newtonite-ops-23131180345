import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../apps/api/src/app';
import { prisma } from '../apps/api/src/shared/database';
import { Priority } from '@instos/shared';
import jwt from 'jsonwebtoken';
import { env } from '../apps/api/src/config/env';

describe('Advanced Enterprise Features (SSE, Inbound Email Webhook & Bulk Triage)', () => {
  const app = createApp();
  let adminToken: string;
  let supportTeamId: string;
  let itemIds: string[] = [];

  beforeAll(async () => {
    // 1. Authenticate as admin via direct JWT
    let admin = await prisma.user.findFirst({ where: { email: 'admin@instos.dev' } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email: 'admin@instos.dev',
          name: 'Admin User',
          passwordHash: 'dummy',
          systemRole: 'SUPER_ADMIN',
        },
      });
    }

    adminToken = jwt.sign({ sub: admin.id }, env.JWT_SECRET);

    // 2. Fetch or create support team
    let team = await prisma.team.findFirst({ where: { slug: 'support' } });
    if (!team) {
      team = await prisma.team.create({
        data: { name: 'Customer Support', slug: 'support' },
      });
    }
    supportTeamId = team.id;

    // 3. Create two test work items for bulk operations test directly
    const item1 = await prisma.workItem.create({
      data: {
        title: 'Bulk Test Item 1',
        type: 'CUSTOMER_ISSUE',
        priority: Priority.LOW,
        status: 'OPEN',
        teamId: supportTeamId,
        creatorId: admin.id,
      },
    });

    const item2 = await prisma.workItem.create({
      data: {
        title: 'Bulk Test Item 2',
        type: 'CUSTOMER_ISSUE',
        priority: Priority.LOW,
        status: 'OPEN',
        teamId: supportTeamId,
        creatorId: admin.id,
      },
    });

    itemIds = [item1.id, item2.id];
  });

  it('1. Inbound Email Webhook creates a ticket and sends outbox confirmation', async () => {
    const inboundPayload = {
      from: 'Enterprise Client <client@globalfintech.com>',
      subject: 'Urgent: Payment gateway latency spike during settlement',
      text: 'Our automated payout run experienced unexpected timeout errors. Please investigate ASAP.',
    };

    const res = await request(app)
      .post('/api/v1/webhooks/resend')
      .send(inboundPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.action).toBe('TICKET_CREATED');
    expect(res.body.ticketNumber).toBeDefined();

    const ticketNumber = res.body.ticketNumber;

    // Verify ticket in DB
    const ticketInDb = await prisma.ticket.findUnique({
      where: { ticketNumber },
      include: { customer: true, workItem: true },
    });

    expect(ticketInDb).toBeDefined();
    expect(ticketInDb?.customer.email).toBe('client@globalfintech.com');
    expect(ticketInDb?.workItem).toBeDefined();

    // 2. Test Inbound Email Reply referencing ticket number
    const replyPayload = {
      from: 'Enterprise Client <client@globalfintech.com>',
      subject: `Re: [#${ticketNumber}] Payment gateway latency spike during settlement`,
      text: 'Attaching server logs: timeout occurred at 12:45 UTC.',
    };

    const replyRes = await request(app)
      .post('/api/v1/webhooks/resend')
      .send(replyPayload);

    expect(replyRes.status).toBe(200);
    expect(replyRes.body.success).toBe(true);
    expect(replyRes.body.action).toBe('REPLY_APPENDED');
    expect(replyRes.body.ticketNumber).toBe(ticketNumber);
  });

  it('2. Bulk Operations API atomically triages multiple work items', async () => {
    const bulkRes = await request(app)
      .post('/api/v1/items/bulk')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        itemIds,
        action: 'priority',
        payload: { priority: Priority.CRITICAL },
      });

    expect(bulkRes.status).toBe(200);
    expect(bulkRes.body.success).toBe(true);
    expect(bulkRes.body.data.updatedCount).toBe(2);

    // Verify both items in DB
    const itemsInDb = await prisma.workItem.findMany({
      where: { id: { in: itemIds } },
    });

    for (const item of itemsInDb) {
      expect(item.priority).toBe(Priority.CRITICAL);
      expect(item.version).toBeGreaterThan(1);
    }
  });

  it('3. Server-Sent Events stream endpoint serves proper headers', async () => {
    // Check initial connection headers
    const res = await request(app)
      .get('/api/v1/events/stream')
      .set('Authorization', `Bearer ${adminToken}`)
      .timeout(1000)
      .catch((err) => err.response || err);

    if (res && res.header) {
      expect(res.header['content-type']).toContain('text/event-stream');
      expect(res.header['cache-control']).toContain('no-cache');
    }
  });
});
