import { prisma } from '../../lib/prisma.js';
import type { UserRole } from '../../domain/constants.js';

export async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, email: true, role: true },
  });
  return users.map((u) => ({
    ...u,
    role: u.role as UserRole,
  }));
}
