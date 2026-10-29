import type { Request, Response } from 'express';
import * as authService from './auth.service.js';

export async function login(_req: Request, res: Response): Promise<void> {
  const body = res.locals.body as { email: string; password: string };
  const result = await authService.login(body.email, body.password);
  res.status(200).json(result);
}

export async function me(req: Request, res: Response): Promise<void> {
  res.status(200).json(authService.me(req.user!));
}
