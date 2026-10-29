import { z } from 'zod';
import { MESSAGE_TYPES } from '../../domain/constants.js';

export const createMessageBodySchema = z
  .object({
    type: z.enum(MESSAGE_TYPES),
    body: z
      .string()
      .transform((s) => s.trim())
      .pipe(
        z
          .string()
          .min(1, 'Body is required')
          .max(5000, 'Body must be at most 5000 characters'),
      ),
  })
  .strict();

export type CreateMessageBody = z.infer<typeof createMessageBodySchema>;
