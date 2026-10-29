import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { forbidden, unauthorized } from '../lib/errors.js';
import { verifyToken, type AuthUser } from '../lib/jwt.js';
import type { UserRole } from '../domain/constants.js';

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw unauthorized('Missing or invalid authorization token');
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw unauthorized('Missing or invalid authorization token');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw unauthorized('Missing or invalid authorization token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw unauthorized('Missing or invalid authorization token');
  }

  const authUser: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
  };
  req.user = authUser;
  next();
}

export function requireRole(role: UserRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw unauthorized('Missing or invalid authorization token');
    }
    if (req.user.role !== role) {
      throw forbidden('Forbidden');
    }
    next();
  };
}
