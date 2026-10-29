import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app.js';

const app = createApp();
const prisma = new PrismaClient();

let adminToken = '';
let agentToken = '';

async function login(email: string, password: string) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res;
}

beforeAll(async () => {
  const admin = await login('admin@demo.local', 'admin123');
  adminToken = admin.body.token;
  const agent = await login('riya@demo.local', 'agent123');
  agentToken = agent.body.token;
});

describe('auth', () => {
  it('401 without token', async () => {
    const res = await request(app).get('/api/tickets');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('login wrong password → 401 INVALID_CREDENTIALS', async () => {
    const res = await login('admin@demo.local', 'wrong');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('login ok → token', async () => {
    const res = await login('admin@demo.local', 'admin123');
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('admin@demo.local');
  });
});

describe('tickets CRUD + validation', () => {
  it('POST missing subject+description+customer → 400 details', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.subject).toBeTruthy();
    expect(res.body.error.details.description).toBeTruthy();
    expect(res.body.error.details.customer).toBeTruthy();
  });

  it('POST valid → 201 and TICKET_CREATED activity', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        subject: 'Test ticket subject',
        description: 'A valid description',
        customerName: 'Test Customer',
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();

    const activity = await request(app)
      .get(`/api/tickets/${res.body.id}/activity`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(activity.status).toBe(200);
    expect(activity.body.some((a: { type: string }) => a.type === 'TICKET_CREATED')).toBe(
      true,
    );
  });

  it('PATCH OPEN→RESOLVED updates resolvedAt, activity, dashboard', async () => {
    const created = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        subject: 'Resolve me please',
        description: 'Will be resolved',
        customerEmail: 'resolve@example.com',
        status: 'OPEN',
      });

    const beforeStats = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    const patched = await request(app)
      .patch(`/api/tickets/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'RESOLVED' });

    expect(patched.status).toBe(200);
    expect(patched.body.resolvedAt).toBeTruthy();
    expect(patched.body.status).toBe('RESOLVED');

    const activity = await request(app)
      .get(`/api/tickets/${created.body.id}/activity`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(
      activity.body.some((a: { type: string }) => a.type === 'STATUS_CHANGED'),
    ).toBe(true);

    const afterStats = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(afterStats.body.resolved).toBe(beforeStats.body.resolved + 1);
    expect(afterStats.body.open).toBe(beforeStats.body.open - 1);
  });

  it('PATCH unknown field → 400; missing id → 404; bad id → 400', async () => {
    const created = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        subject: 'Patch validation',
        description: 'desc',
        customerName: 'X',
      });

    const unknown = await request(app)
      .patch(`/api/tickets/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ foo: 'bar' });
    expect(unknown.status).toBe(400);

    const missing = await request(app)
      .patch('/api/tickets/999999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'OPEN' });
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('NOT_FOUND');

    const badId = await request(app)
      .get('/api/tickets/abc')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(badId.status).toBe(400);
    expect(badId.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('messages', () => {
  it('REPLY sets firstResponseAt; NOTE does not', async () => {
    const noteTicket = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        subject: 'Note first ticket',
        description: 'testing notes',
        customerName: 'Notee',
      });

    const note = await request(app)
      .post(`/api/tickets/${noteTicket.body.id}/messages`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'NOTE', body: 'Internal note only' });
    expect(note.status).toBe(201);

    const afterNote = await request(app)
      .get(`/api/tickets/${noteTicket.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(afterNote.body.firstResponseAt).toBeNull();

    const replyTicket = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        subject: 'Reply first ticket',
        description: 'testing replies',
        customerEmail: 'reply@example.com',
      });

    const reply = await request(app)
      .post(`/api/tickets/${replyTicket.body.id}/messages`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'REPLY', body: 'Public reply to customer' });
    expect(reply.status).toBe(201);

    const afterReply = await request(app)
      .get(`/api/tickets/${replyTicket.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(afterReply.body.firstResponseAt).toBeTruthy();
    expect(afterReply.body.messageCount).toBe(1);

    const activity = await request(app)
      .get(`/api/tickets/${replyTicket.body.id}/activity`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(activity.body.some((a: { type: string }) => a.type === 'REPLY_ADDED')).toBe(
      true,
    );
  });
});

describe('list filters', () => {
  it('combines status/priority/q; sort=priority; invalid status 400', async () => {
    await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        subject: 'UniqueZebraFilterTerm',
        description: 'filter test',
        customerName: 'Zebra',
        status: 'OPEN',
        priority: 'URGENT',
      });

    await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        subject: 'Low priority filler',
        description: 'filter test',
        customerName: 'Low',
        status: 'IN_PROGRESS',
        priority: 'LOW',
      });

    const filtered = await request(app)
      .get('/api/tickets')
      .query({
        status: 'OPEN,IN_PROGRESS',
        priority: 'URGENT',
        q: 'UniqueZebraFilterTerm',
      })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(filtered.status).toBe(200);
    expect(filtered.body.data.length).toBeGreaterThanOrEqual(1);
    expect(
      filtered.body.data.every(
        (t: { priority: string; subject: string }) =>
          t.priority === 'URGENT' && t.subject.includes('UniqueZebra'),
      ),
    ).toBe(true);

    const sorted = await request(app)
      .get('/api/tickets')
      .query({ sort: 'priority', order: 'desc', pageSize: 50 })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(sorted.status).toBe(200);
    expect(sorted.body.data[0].priority).toBe('URGENT');

    const invalid = await request(app)
      .get('/api/tickets')
      .query({ status: 'FOO' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(invalid.status).toBe(400);
  });
});

describe('delete', () => {
  it('AGENT 403; ADMIN 204 and cascades', async () => {
    const created = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        subject: 'Delete me',
        description: 'will be deleted',
        customerName: 'Gone',
      });

    await request(app)
      .post(`/api/tickets/${created.body.id}/messages`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'NOTE', body: 'note before delete' });

    const asAgent = await request(app)
      .delete(`/api/tickets/${created.body.id}`)
      .set('Authorization', `Bearer ${agentToken}`);
    expect(asAgent.status).toBe(403);
    expect(asAgent.body.error.code).toBe('FORBIDDEN');

    const asAdmin = await request(app)
      .delete(`/api/tickets/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(asAdmin.status).toBe(204);

    const messages = await prisma.message.count({ where: { ticketId: created.body.id } });
    const activities = await prisma.activity.count({
      where: { ticketId: created.body.id },
    });
    expect(messages).toBe(0);
    expect(activities).toBe(0);
  });
});

describe('overdue + slaBreached filters', () => {
  it('overdue ticket appears then disappears when resolved', async () => {
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: 'admin@demo.local' },
    });
    const createdAt = new Date(Date.now() - 30 * 60 * 60 * 1000);
    const ticket = await prisma.ticket.create({
      data: {
        subject: 'Overdue direct insert',
        description: 'backdated',
        customerName: 'Late',
        status: 'OPEN',
        priority: 'MEDIUM',
        priorityRank: 2,
        createdById: admin.id,
        createdAt,
        updatedAt: createdAt,
      },
    });

    const list = await request(app)
      .get('/api/tickets')
      .query({ overdue: 'true', q: 'Overdue direct insert' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    const found = list.body.data.find((t: { id: number }) => t.id === ticket.id);
    expect(found).toBeTruthy();
    expect(found.isOverdue).toBe(true);

    await request(app)
      .patch(`/api/tickets/${ticket.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'RESOLVED' });

    const after = await request(app)
      .get('/api/tickets')
      .query({ overdue: 'true', q: 'Overdue direct insert' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(after.body.data.find((t: { id: number }) => t.id === ticket.id)).toBeFalsy();
  });

  it('slaBreached=true then cleared after REPLY', async () => {
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: 'admin@demo.local' },
    });
    const createdAt = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const ticket = await prisma.ticket.create({
      data: {
        subject: 'SLA breach direct insert',
        description: 'no reply yet',
        customerEmail: 'sla@example.com',
        status: 'OPEN',
        priority: 'HIGH',
        priorityRank: 3,
        createdById: admin.id,
        createdAt,
        updatedAt: createdAt,
        firstResponseAt: null,
      },
    });

    const list = await request(app)
      .get('/api/tickets')
      .query({ slaBreached: 'true', q: 'SLA breach direct insert' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(list.body.data.some((t: { id: number }) => t.id === ticket.id)).toBe(true);

    await request(app)
      .post(`/api/tickets/${ticket.id}/messages`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'REPLY', body: 'First public reply clears SLA breach' });

    const after = await request(app)
      .get('/api/tickets')
      .query({ slaBreached: 'true', q: 'SLA breach direct insert' })
      .set('Authorization', `Bearer ${adminToken}`);
    expect(after.body.data.some((t: { id: number }) => t.id === ticket.id)).toBe(false);
  });
});
