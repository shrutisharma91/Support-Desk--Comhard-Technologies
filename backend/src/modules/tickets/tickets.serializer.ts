import type { Ticket, User } from '@prisma/client';
import { isOverdue, isSlaBreached, slaDueAt } from '../../domain/rules.js';
import type { TicketPriority, TicketStatus, UserRole } from '../../domain/constants.js';

type UserRow = Pick<User, 'id' | 'name' | 'email' | 'role'>;

export type TicketRow = Ticket & {
  assignee: UserRow | null;
  createdBy: UserRow | null;
  _count: { messages: number };
};

function serializeUser(user: UserRow | null) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
  };
}

export function serializeTicket(
  row: TicketRow,
  opts: { slaHours: number; now?: Date },
) {
  const now = opts.now ?? new Date();
  return {
    id: row.id,
    subject: row.subject,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    description: row.description,
    status: row.status as TicketStatus,
    priority: row.priority as TicketPriority,
    assignee: serializeUser(row.assignee),
    createdBy: serializeUser(row.createdBy),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
    firstResponseAt: row.firstResponseAt ? row.firstResponseAt.toISOString() : null,
    messageCount: row._count.messages,
    isOverdue: isOverdue(row, now),
    slaDueAt: slaDueAt(row.createdAt, opts.slaHours).toISOString(),
    slaBreached: isSlaBreached(row, opts.slaHours, now),
  };
}
