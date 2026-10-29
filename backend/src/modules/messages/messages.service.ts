import { prisma } from '../../lib/prisma.js';
import { notFound } from '../../lib/errors.js';
import type { AuthUser } from '../../lib/jwt.js';
import type { UserRole } from '../../domain/constants.js';
import type { CreateMessageBody } from './messages.schemas.js';

function serializeMessage(row: {
  id: number;
  ticketId: number;
  type: string;
  body: string;
  createdAt: Date;
  author: { id: number; name: string; email: string; role: string } | null;
}) {
  return {
    id: row.id,
    ticketId: row.ticketId,
    type: row.type,
    body: row.body,
    author: row.author
      ? {
          id: row.author.id,
          name: row.author.name,
          email: row.author.email,
          role: row.author.role as UserRole,
        }
      : null,
    createdAt: row.createdAt.toISOString(),
  };
}

async function assertTicketExists(ticketId: number) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw notFound(`Ticket ${ticketId} not found`);
  }
  return ticket;
}

export async function listMessages(ticketId: number) {
  await assertTicketExists(ticketId);
  const messages = await prisma.message.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { id: true, name: true, email: true, role: true } },
    },
  });
  return messages.map(serializeMessage);
}

export async function createMessage(
  ticketId: number,
  body: CreateMessageBody,
  user: AuthUser,
) {
  const ticket = await assertTicketExists(ticketId);
  const now = new Date();
  const isFirstReply =
    body.type === 'REPLY' && ticket.firstResponseAt === null;

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: {
        ticketId,
        type: body.type,
        body: body.body,
        authorId: user.id,
        createdAt: now,
      },
      include: {
        author: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    await tx.activity.create({
      data: {
        ticketId,
        type: body.type === 'REPLY' ? 'REPLY_ADDED' : 'NOTE_ADDED',
        actorId: user.id,
        fromValue: null,
        toValue: null,
        createdAt: now,
      },
    });

    await tx.ticket.update({
      where: { id: ticketId },
      data: {
        updatedAt: now,
        ...(isFirstReply ? { firstResponseAt: now } : {}),
      },
    });

    return created;
  });

  return serializeMessage(message);
}
