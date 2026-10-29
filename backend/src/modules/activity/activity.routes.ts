import { Router } from 'express';
import { parseId } from '../../lib/http.js';
import * as activityService from './activity.service.js';

export const activityRouter = Router({ mergeParams: true });

activityRouter.get('/', async (req, res) => {
  const params = req.params as { id: string };
  const ticketId = parseId(params.id);
  const activity = await activityService.listActivity(ticketId);
  res.status(200).json(activity);
});
