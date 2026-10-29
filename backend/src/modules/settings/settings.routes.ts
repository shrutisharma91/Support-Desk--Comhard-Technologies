import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { patchSettingsBodySchema } from './settings.schemas.js';
import * as settingsService from './settings.service.js';

export const settingsRouter = Router();

settingsRouter.get('/', requireAuth, async (_req, res) => {
  const settings = await settingsService.getSettings();
  res.status(200).json(settings);
});

settingsRouter.patch(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  validate({ body: patchSettingsBodySchema }),
  async (_req, res) => {
    const body = res.locals.body as { slaHours: number };
    const settings = await settingsService.updateSettings(body.slaHours);
    res.status(200).json(settings);
  },
);
