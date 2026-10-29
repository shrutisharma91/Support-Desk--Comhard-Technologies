import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { createMessageBodySchema } from './messages.schemas.js';
import * as controller from './messages.controller.js';

export const messagesRouter = Router({ mergeParams: true });

messagesRouter.get('/', controller.list);
messagesRouter.post('/', validate({ body: createMessageBodySchema }), controller.create);
