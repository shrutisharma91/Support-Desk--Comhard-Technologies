import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { loginBodySchema } from './auth.schemas.js';
import * as controller from './auth.controller.js';

export const authRouter = Router();

authRouter.post('/login', validate({ body: loginBodySchema }), controller.login);
authRouter.get('/me', requireAuth, controller.me);
