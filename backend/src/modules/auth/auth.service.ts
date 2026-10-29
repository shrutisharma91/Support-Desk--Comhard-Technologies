import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { invalidCredentials } from '../../lib/errors.js';
import { signToken, type AuthUser } from '../../lib/jwt.js';
import type { UserRole } from '../../domain/constants.js';

function toUserSummary(user: {
  id: number;
  name: string;
  email: string;
  role: string;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
  };
}

export async function login(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) {
    throw invalidCredentials();
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw invalidCredentials();
  }

  const summary = toUserSummary(user);
  return { token: signToken(user), user: summary };
}

export function me(user: AuthUser): AuthUser {
  return user;
}
