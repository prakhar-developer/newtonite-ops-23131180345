import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../apps/api/src/app';
import { prisma } from '../apps/api/src/shared/database';

describe('Critical Behaviour 3: Idempotency & Repeated Request Safety', () => {
  const app = createApp();

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Repeated request with same key creates single ticket and replays cached response', async () => {
    const key = `test-key-${Date.now()}`;
    const payload = {
      name: 'Idempotency Tester',
      email: 'idemp@tester.com',
      title: 'Idempotent Test Ticket',
      description: 'Testing double-click protection',
      category: 'CUSTOMER_ISSUE',
      priority: 'MEDIUM',
    };

    // First Request
    const res1 = await request(app)
      .post('/api/v1/tickets')
      .set('Idempotency-Key', key)
      .send(payload);

    expect(res1.status).toBe(201);
    expect(res1.body.success).toBe(true);
    const createdTicketNumber = res1.body.data.ticketNumber;

    // Second Request (Immediate retry with identical key & payload)
    const res2 = await request(app)
      .post('/api/v1/tickets')
      .set('Idempotency-Key', key)
      .send(payload);

    expect(res2.status).toBe(201);
    expect(res2.header['idempotent-replay']).toBe('true');
    expect(res2.body.data.ticketNumber).toBe(createdTicketNumber);

    // Verify DB count: only 1 ticket created
    const count = await prisma.ticket.count({
      where: { title: 'Idempotent Test Ticket' },
    });
    expect(count).toBe(1);
  });

  it('Same idempotency key with different payload returns 409 Conflict', async () => {
    const key = `test-key-tamper-${Date.now()}`;

    // Request 1
    await request(app)
      .post('/api/v1/tickets')
      .set('Idempotency-Key', key)
      .send({
        name: 'Original Name',
        email: 'original@test.com',
        title: 'Original Title',
        description: 'Original description here',
      });

    // Request 2 with tampered body
    const res2 = await request(app)
      .post('/api/v1/tickets')
      .set('Idempotency-Key', key)
      .send({
        name: 'Tampered Name',
        email: 'tampered@test.com',
        title: 'Tampered Title',
        description: 'Altered payload',
      });

    expect(res2.status).toBe(409);
    expect(res2.body.error.code).toBe('CONFLICT');
  });
});
