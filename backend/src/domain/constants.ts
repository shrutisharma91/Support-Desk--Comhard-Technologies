export const STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'WAITING_ON_CUSTOMER',
  'RESOLVED',
] as const;

export type TicketStatus = (typeof STATUSES)[number];

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export type TicketPriority = (typeof PRIORITIES)[number];

export const MESSAGE_TYPES = ['REPLY', 'NOTE'] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export const ROLES = ['ADMIN', 'AGENT'] as const;
export type UserRole = (typeof ROLES)[number];

export const ACTIVITY_TYPES = [
  'TICKET_CREATED',
  'STATUS_CHANGED',
  'PRIORITY_CHANGED',
  'ASSIGNEE_CHANGED',
  'DETAILS_UPDATED',
  'REPLY_ADDED',
  'NOTE_ADDED',
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const PRIORITY_RANK: Record<TicketPriority, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  URGENT: 4,
};

export const OVERDUE_HOURS = 24;
export const DEFAULT_SLA_HOURS = 4;
