import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import * as dashboardService from './dashboard.service.js';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', requireAuth, async (_req, res) => {
  const stats = await dashboardService.getStats();
  res.status(200).json(stats);
});
