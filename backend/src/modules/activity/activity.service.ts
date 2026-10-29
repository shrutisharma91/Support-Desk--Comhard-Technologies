import { prisma } from '../../lib/prisma.js';
import { notFound } from '../../lib/errors.js';
import { serializeActivity } from './activity.serializer.js';

export async function listActivity(ticketId: number) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw notFound(`Ticket ${ticketId} not found`);
  }

  const rows = await prisma.activity.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'asc' },
    include: {
      actor: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  return rows.map(serializeActivity);
}
