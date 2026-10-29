import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { notFound, validation } from '../../lib/errors.js';
import type { AuthUser } from '../../lib/jwt.js';
import { PRIORITY_RANK } from '../../domain/constants.js';
import {
  diffTicketChanges,
  overdueCutoff,
  resolvedAtFor,
  type TicketSnapshot,
} from '../../domain/rules.js';
import { getSlaHours } from '../settings/settings.service.js';
import { serializeTicket, type TicketRow } from './tickets.serializer.js';
import type { CreateTicketBody, ListTicketsQuery, PatchTicketBody } from './tickets.schemas.js';

const ticketInclude = {
  assignee: { select: { id: true, name: true, email: true, role: true } },
  createdBy: { select: { id: true, name: true, email: true, role: true } },
  _count: { select: { messages: true } },
} satisfies Prisma.TicketInclude;

async function assertAssigneeExists(assigneeId: number | null | undefined) {
  if (assigneeId == null) return;
  const user = await prisma.user.findUnique({ where: { id: assigneeId } });
  if (!user) {
    throw validation('Validation failed', { assigneeId: 'Assignee not found' });
  }
}

async function loadTicketOrThrow(id: number): Promise<TicketRow> {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: ticketInclude,
  });
  if (!ticket) {
    throw notFound(`Ticket ${id} not found`);
  }
  return ticket;
}

function buildWhere(
  query: ListTicketsQuery,
  user: AuthUser,
  slaHours: number,
  now: Date,
): Prisma.TicketWhereInput {
  const where: Prisma.TicketWhereInput = {};
  const and: Prisma.TicketWhereInput[] = [];

  if (query.q) {
    and.push({
      OR: [
        { subject: { contains: query.q } },
        { customerName: { contains: query.q } },
        { customerEmail: { contains: query.q } },
      ],
    });
  }

  if (query.status && query.status.length > 0) {
    and.push({ status: { in: query.status } });
  }

  if (query.priority && query.priority.length > 0) {
    and.push({ priority: { in: query.priority } });
  }

  if (query.assigneeId !== undefined) {
    if (query.assigneeId === 'unassigned') {
      and.push({ assigneeId: null });
    } else if (query.assigneeId === 'me') {
      and.push({ assigneeId: user.id });
    } else {
      and.push({ assigneeId: query.assigneeId });
    }
  }

  if (query.overdue) {
    and.push({
      status: { not: 'RESOLVED' },
      createdAt: { lt: overdueCutoff(now) },
    });
  }

  if (query.slaBreached) {
    and.push({
      status: { not: 'RESOLVED' },
      firstResponseAt: null,
      createdAt: { lt: new Date(now.getTime() - slaHours * 60 * 60 * 1000) },
    });
  }

  if (and.length > 0) {
    where.AND = and;
  }

  return where;
}

function buildOrderBy(
  sort: ListTicketsQuery['sort'],
  order: ListTicketsQuery['order'],
): Prisma.TicketOrderByWithRelationInput[] {
  if (sort === 'priority') {
    return [{ priorityRank: order }, { updatedAt: 'desc' }];
  }
  if (sort === 'created') {
    return [{ createdAt: order }];
  }
  return [{ updatedAt: order }];
}

export async function listTickets(query: ListTicketsQuery, user: AuthUser) {
  const now = new Date();
  const slaHours = await getSlaHours();
  const where = buildWhere(query, user, slaHours, now);
  const orderBy = buildOrderBy(query.sort, query.order);
  const skip = (query.page - 1) * query.pageSize;

  const [total, rows] = await prisma.$transaction([
    prisma.ticket.count({ where }),
    prisma.ticket.findMany({
      where,
      include: ticketInclude,
      orderBy,
      skip,
      take: query.pageSize,
    }),
  ]);

  return {
    data: rows.map((row) => serializeTicket(row, { slaHours, now })),
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    },
  };
}

export async function getTicket(id: number) {
  const now = new Date();
  const slaHours = await getSlaHours();
  const ticket = await loadTicketOrThrow(id);
  return serializeTicket(ticket, { slaHours, now });
}

export async function createTicket(body: CreateTicketBody, user: AuthUser) {
  await assertAssigneeExists(body.assigneeId ?? null);

  const now = new Date();
  const priority = body.priority;
  const status = body.status;
  const resolvedAt = status === 'RESOLVED' ? now : null;

  let assigneeName: string | null = null;
  if (body.assigneeId != null) {
    const assignee = await prisma.user.findUnique({ where: { id: body.assigneeId } });
    assigneeName = assignee?.name ?? null;
  }

  const ticket = await prisma.$transaction(async (tx) => {
    const created = await tx.ticket.create({
      data: {
        subject: body.subject,
        customerName: body.customerName ?? null,
        customerEmail: body.customerEmail ?? null,
        description: body.description,
        priority,
        priorityRank: PRIORITY_RANK[priority],
        status,
        assigneeId: body.assigneeId ?? null,
        createdById: user.id,
        createdAt: now,
        updatedAt: now,
        resolvedAt,
      },
    });

    await tx.activity.create({
      data: {
        ticketId: created.id,
        type: 'TICKET_CREATED',
        actorId: user.id,
        fromValue: null,
        toValue: null,
        createdAt: now,
      },
    });

    if (body.assigneeId != null) {
      await tx.activity.create({
        data: {
          ticketId: created.id,
          type: 'ASSIGNEE_CHANGED',
          actorId: user.id,
          fromValue: null,
          toValue: assigneeName,
          createdAt: now,
        },
      });
    }

    return tx.ticket.findUniqueOrThrow({
      where: { id: created.id },
      include: ticketInclude,
    });
  });

  const slaHours = await getSlaHours();
  return serializeTicket(ticket, { slaHours, now });
}

export async function updateTicket(
  id: number,
  body: PatchTicketBody,
  user: AuthUser,
) {
  const existing = await loadTicketOrThrow(id);

  if (body.assigneeId !== undefined) {
    await assertAssigneeExists(body.assigneeId);
  }

  const next: TicketSnapshot = {
    subject: body.subject ?? existing.subject,
    customerName:
      body.customerName !== undefined ? body.customerName : existing.customerName,
    customerEmail:
      body.customerEmail !== undefined ? body.customerEmail : existing.customerEmail,
    description: body.description ?? existing.description,
    status: body.status ?? existing.status,
    priority: body.priority ?? existing.priority,
    assigneeId:
      body.assigneeId !== undefined ? body.assigneeId : existing.assigneeId,
  };

  if (!next.customerName && !next.customerEmail) {
    throw validation('Validation failed', {
      customer: 'Provide a customer name or email',
    });
  }

  const before: TicketSnapshot = {
    subject: existing.subject,
    customerName: existing.customerName,
    customerEmail: existing.customerEmail,
    description: existing.description,
    status: existing.status,
    priority: existing.priority,
    assigneeId: existing.assigneeId,
  };

  let afterName: string | null = existing.assignee?.name ?? null;
  if (body.assigneeId !== undefined) {
    if (body.assigneeId === null) {
      afterName = null;
    } else {
      const assignee = await prisma.user.findUnique({ where: { id: body.assigneeId } });
      afterName = assignee?.name ?? null;
    }
  }

  const drafts = diffTicketChanges(before, next, {
    beforeName: existing.assignee?.name ?? null,
    afterName,
  });

  if (drafts.length === 0) {
    const slaHours = await getSlaHours();
    return serializeTicket(existing, { slaHours, now: new Date() });
  }

  const now = new Date();
  const resolvedAtResult = resolvedAtFor(existing.status, next.status, now);

  const ticket = await prisma.$transaction(async (tx) => {
    await tx.ticket.update({
      where: { id },
      data: {
        subject: next.subject,
        customerName: next.customerName,
        customerEmail: next.customerEmail,
        description: next.description,
        status: next.status,
        priority: next.priority,
        priorityRank: PRIORITY_RANK[next.priority as keyof typeof PRIORITY_RANK],
        assigneeId: next.assigneeId,
        updatedAt: now,
        ...(resolvedAtResult !== undefined ? { resolvedAt: resolvedAtResult } : {}),
      },
    });

    for (const draft of drafts) {
      await tx.activity.create({
        data: {
          ticketId: id,
          type: draft.type,
          actorId: user.id,
          fromValue: draft.fromValue,
          toValue: draft.toValue,
          createdAt: now,
        },
      });
    }

    return tx.ticket.findUniqueOrThrow({
      where: { id },
      include: ticketInclude,
    });
  });

  const slaHours = await getSlaHours();
  return serializeTicket(ticket, { slaHours, now });
}

export async function deleteTicket(id: number) {
  const existing = await prisma.ticket.findUnique({ where: { id } });
  if (!existing) {
    throw notFound(`Ticket ${id} not found`);
  }
  await prisma.ticket.delete({ where: { id } });
}
