import { prisma } from '../../lib/prisma.js';
import { overdueCutoff } from '../../domain/rules.js';
import { getSlaHours } from '../settings/settings.service.js';

export async function getStats() {
  const now = new Date();
  const slaHours = await getSlaHours();
  const overdueBefore = overdueCutoff(now);
  const slaCutoff = new Date(now.getTime() - slaHours * 60 * 60 * 1000);

  const [
    total,
    open,
    inProgress,
    waitingOnCustomer,
    resolved,
    urgent,
    overdue,
    slaBreached,
    unassigned,
  ] = await prisma.$transaction([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: 'OPEN' } }),
    prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.ticket.count({ where: { status: 'WAITING_ON_CUSTOMER' } }),
    prisma.ticket.count({ where: { status: 'RESOLVED' } }),
    prisma.ticket.count({
      where: { priority: 'URGENT', status: { not: 'RESOLVED' } },
    }),
    prisma.ticket.count({
      where: { status: { not: 'RESOLVED' }, createdAt: { lt: overdueBefore } },
    }),
    prisma.ticket.count({
      where: {
        status: { not: 'RESOLVED' },
        firstResponseAt: null,
        createdAt: { lt: slaCutoff },
      },
    }),
    prisma.ticket.count({
      where: { assigneeId: null, status: { not: 'RESOLVED' } },
    }),
  ]);

  return {
    total,
    open,
    inProgress,
    waitingOnCustomer,
    resolved,
    urgent,
    overdue,
    slaBreached,
    unassigned,
    slaHours,
  };
}
