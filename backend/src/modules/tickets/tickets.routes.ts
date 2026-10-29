import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  createTicketBodySchema,
  listTicketsQuerySchema,
  patchTicketBodySchema,
} from './tickets.schemas.js';
import * as controller from './tickets.controller.js';
import { messagesRouter } from '../messages/messages.routes.js';
import { activityRouter } from '../activity/activity.routes.js';

export const ticketsRouter = Router();

ticketsRouter.use(requireAuth);

ticketsRouter.get('/', validate({ query: listTicketsQuerySchema }), controller.list);
ticketsRouter.post('/', validate({ body: createTicketBodySchema }), controller.create);
ticketsRouter.get('/:id', controller.getById);
ticketsRouter.patch('/:id', validate({ body: patchTicketBodySchema }), controller.patch);
ticketsRouter.delete('/:id', requireRole('ADMIN'), controller.remove);

ticketsRouter.use('/:id/messages', messagesRouter);
ticketsRouter.use('/:id/activity', activityRouter);
