import type { Request, Response } from 'express';
import { parseId } from '../../lib/http.js';
import type { CreateMessageBody } from './messages.schemas.js';
import * as messagesService from './messages.service.js';

export async function list(req: Request, res: Response): Promise<void> {
  const ticketId = parseId(req.params.id as string);
  const messages = await messagesService.listMessages(ticketId);
  res.status(200).json(messages);
}

export async function create(req: Request, res: Response): Promise<void> {
  const ticketId = parseId(req.params.id as string);
  const body = res.locals.body as CreateMessageBody;
  const message = await messagesService.createMessage(ticketId, body, req.user!);
  res.status(201).json(message);
}
