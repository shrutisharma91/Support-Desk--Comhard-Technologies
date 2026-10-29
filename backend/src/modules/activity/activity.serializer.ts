import type { UserRole } from '../../domain/constants.js';

export function serializeActivity(row: {
  id: number;
  ticketId: number;
  type: string;
  fromValue: string | null;
  toValue: string | null;
  createdAt: Date;
  actor: { id: number; name: string; email: string; role: string } | null;
}) {
  return {
    id: row.id,
    ticketId: row.ticketId,
    type: row.type,
    actor: row.actor
      ? {
          id: row.actor.id,
          name: row.actor.name,
          email: row.actor.email,
          role: row.actor.role as UserRole,
        }
      : null,
    fromValue: row.fromValue,
    toValue: row.toValue,
    createdAt: row.createdAt.toISOString(),
  };
}
