import { OVERDUE_HOURS, type ActivityType, type TicketPriority, type TicketStatus } from './constants.js';

export type ActivityDraft = {
  type: ActivityType;
  fromValue: string | null;
  toValue: string | null;
};

export function overdueCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - OVERDUE_HOURS * 60 * 60 * 1000);
}

export function isOverdue(
  ticket: { status: string; createdAt: Date },
  now: Date = new Date(),
): boolean {
  return ticket.status !== 'RESOLVED' && ticket.createdAt < overdueCutoff(now);
}

export function slaDueAt(createdAt: Date, slaHours: number): Date {
  return new Date(createdAt.getTime() + slaHours * 60 * 60 * 1000);
}

export function isSlaBreached(
  ticket: { status: string; createdAt: Date; firstResponseAt: Date | null },
  slaHours: number,
  now: Date = new Date(),
): boolean {
  if (ticket.status === 'RESOLVED') return false;
  if (ticket.firstResponseAt !== null) return false;
  return now > slaDueAt(ticket.createdAt, slaHours);
}

export type TicketSnapshot = {
  subject: string;
  customerName: string | null;
  customerEmail: string | null;
  description: string;
  status: TicketStatus | string;
  priority: TicketPriority | string;
  assigneeId: number | null;
};

export function diffTicketChanges(
  before: TicketSnapshot,
  after: TicketSnapshot,
  names: { beforeName: string | null; afterName: string | null },
): ActivityDraft[] {
  const drafts: ActivityDraft[] = [];

  if (before.status !== after.status) {
    drafts.push({
      type: 'STATUS_CHANGED',
      fromValue: before.status,
      toValue: after.status,
    });
  }

  if (before.priority !== after.priority) {
    drafts.push({
      type: 'PRIORITY_CHANGED',
      fromValue: before.priority,
      toValue: after.priority,
    });
  }

  if (before.assigneeId !== after.assigneeId) {
    drafts.push({
      type: 'ASSIGNEE_CHANGED',
      fromValue: names.beforeName,
      toValue: names.afterName,
    });
  }

  const detailFields: Array<keyof TicketSnapshot> = [
    'subject',
    'customerName',
    'customerEmail',
    'description',
  ];
  const changedDetails = detailFields.filter((f) => before[f] !== after[f]);
  if (changedDetails.length > 0) {
    drafts.push({
      type: 'DETAILS_UPDATED',
      fromValue: null,
      toValue: changedDetails.join(', '),
    });
  }

  return drafts;
}

export function resolvedAtFor(
  prevStatus: string,
  nextStatus: string,
  now: Date = new Date(),
): Date | null | undefined {
  if (prevStatus !== 'RESOLVED' && nextStatus === 'RESOLVED') {
    return now;
  }
  if (prevStatus === 'RESOLVED' && nextStatus !== 'RESOLVED') {
    return null;
  }
  return undefined;
}
