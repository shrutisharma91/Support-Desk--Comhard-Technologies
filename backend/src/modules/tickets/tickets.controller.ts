import type { Request, Response } from 'express';
import { parseId } from '../../lib/http.js';
import type { CreateTicketBody, ListTicketsQuery, PatchTicketBody } from './tickets.schemas.js';
import * as ticketsService from './tickets.service.js';

export async function list(req: Request, res: Response): Promise<void> {
  const query = res.locals.query as ListTicketsQuery;
  const result = await ticketsService.listTickets(query, req.user!);
  res.status(200).json(result);
}

export async function create(req: Request, res: Response): Promise<void> {
  const body = res.locals.body as CreateTicketBody;
  const ticket = await ticketsService.createTicket(body, req.user!);
  res.status(201).json(ticket);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id as string);
  const ticket = await ticketsService.getTicket(id);
  res.status(200).json(ticket);
}

export async function patch(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id as string);
  const body = res.locals.body as PatchTicketBody;
  const ticket = await ticketsService.updateTicket(id, body, req.user!);
  res.status(200).json(ticket);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id as string);
  await ticketsService.deleteTicket(id);
  res.status(204).send();
}
