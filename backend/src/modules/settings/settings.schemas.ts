import { z } from 'zod';

export const patchSettingsBodySchema = z
  .object({
    slaHours: z
      .number({ error: 'slaHours is required' })
      .int('slaHours must be an integer')
      .min(1, 'slaHours must be between 1 and 168')
      .max(168, 'slaHours must be between 1 and 168'),
  })
  .strict();
