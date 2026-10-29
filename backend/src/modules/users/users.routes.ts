import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as usersService from './users.service.js';

export const usersRouter = Router();

usersRouter.get('/', requireAuth, async (_req, res) => {
  const users = await usersService.listUsers();
  res.status(200).json(users);
});
