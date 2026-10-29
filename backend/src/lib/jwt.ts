import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { UserRole } from '../domain/constants.js';

export type JwtPayload = {
  sub: number;
  role: UserRole;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export function signToken(user: { id: number; role: string }): string {
  const payload: JwtPayload = { sub: user.id, role: user.role as UserRole };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  if (typeof decoded.sub !== 'number' && typeof decoded.sub !== 'string') {
    throw new Error('Invalid token payload');
  }
  return {
    sub: typeof decoded.sub === 'string' ? Number(decoded.sub) : decoded.sub,
    role: decoded.role as UserRole,
  };
}
