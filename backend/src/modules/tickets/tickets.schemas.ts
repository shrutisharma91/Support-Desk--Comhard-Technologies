import { z } from 'zod';
import { PRIORITIES, STATUSES } from '../../domain/constants.js';

function normalizeOptionalText(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  return t === '' ? null : t;
}

export const createTicketBodySchema = z
  .object({
    subject: z.unknown().optional(),
    description: z.unknown().optional(),
    customerName: z.unknown().optional(),
    customerEmail: z.unknown().optional(),
    priority: z.enum(PRIORITIES).optional().default('MEDIUM'),
    status: z.enum(STATUSES).optional().default('OPEN'),
    assigneeId: z.number().int().positive().nullable().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (typeof data.subject !== 'string') {
      ctx.addIssue({
        code: 'custom',
        path: ['subject'],
        message: 'Subject is required',
      });
    } else {
      const subject = data.subject.trim();
      if (subject.length < 3 || subject.length > 200) {
        ctx.addIssue({
          code: 'custom',
          path: ['subject'],
          message: 'Subject must be 3–200 characters',
        });
      }
    }

    if (typeof data.description !== 'string') {
      ctx.addIssue({
        code: 'custom',
        path: ['description'],
        message: 'Description is required',
      });
    } else {
      const description = data.description.trim();
      if (description.length < 1) {
        ctx.addIssue({
          code: 'custom',
          path: ['description'],
          message: 'Description is required',
        });
      } else if (description.length > 5000) {
        ctx.addIssue({
          code: 'custom',
          path: ['description'],
          message: 'Description must be at most 5000 characters',
        });
      }
    }

    const customerName = normalizeOptionalText(data.customerName);
    let customerEmail: string | null | undefined;
    if (data.customerEmail === undefined) {
      customerEmail = undefined;
    } else if (data.customerEmail === null || data.customerEmail === '') {
      customerEmail = null;
    } else if (typeof data.customerEmail === 'string') {
      const email = data.customerEmail.trim().toLowerCase();
      if (email.length > 254) {
        ctx.addIssue({
          code: 'custom',
          path: ['customerEmail'],
          message: 'Email must be at most 254 characters',
        });
      }
      const emailOk = z.string().email().safeParse(email);
      if (!emailOk.success) {
        ctx.addIssue({
          code: 'custom',
          path: ['customerEmail'],
          message: 'Invalid email',
        });
      }
      customerEmail = email;
    } else {
      ctx.addIssue({
        code: 'custom',
        path: ['customerEmail'],
        message: 'Invalid email',
      });
      customerEmail = null;
    }

    if (customerName === null || customerName === undefined) {
      if (typeof data.customerName === 'string' && data.customerName.length > 120) {
        ctx.addIssue({
          code: 'custom',
          path: ['customerName'],
          message: 'Customer name must be at most 120 characters',
        });
      }
    } else if (customerName.length > 120) {
      ctx.addIssue({
        code: 'custom',
        path: ['customerName'],
        message: 'Customer name must be at most 120 characters',
      });
    }

    const hasCustomer =
      (typeof customerName === 'string' && customerName.length > 0) ||
      (typeof customerEmail === 'string' && customerEmail.length > 0);
    if (!hasCustomer) {
      ctx.addIssue({
        code: 'custom',
        path: ['customer'],
        message: 'Provide a customer name or email',
      });
    }
  })
  .transform((data) => {
    const customerName = normalizeOptionalText(data.customerName) ?? null;
    let customerEmail: string | null = null;
    if (typeof data.customerEmail === 'string' && data.customerEmail.trim() !== '') {
      customerEmail = data.customerEmail.trim().toLowerCase();
    }
    return {
      subject: (data.subject as string).trim(),
      description: (data.description as string).trim(),
      customerName,
      customerEmail,
      priority: data.priority,
      status: data.status,
      assigneeId: data.assigneeId,
    };
  });

export const patchTicketBodySchema = z
  .object({
    subject: z
      .string()
      .transform((s) => s.trim())
      .pipe(
        z
          .string()
          .min(3, 'Subject must be 3–200 characters')
          .max(200, 'Subject must be 3–200 characters'),
      )
      .optional(),
    description: z
      .string()
      .transform((s) => s.trim())
      .pipe(
        z
          .string()
          .min(1, 'Description is required')
          .max(5000, 'Description must be at most 5000 characters'),
      )
      .optional(),
    customerName: z
      .string()
      .max(120, 'Customer name must be at most 120 characters')
      .nullish()
      .transform((v) => {
        if (v === undefined) return undefined;
        if (v === null) return null;
        const t = v.trim();
        return t === '' ? null : t;
      }),
    customerEmail: z
      .union([
        z.literal(''),
        z.null(),
        z.string().email('Invalid email').max(254, 'Email must be at most 254 characters'),
      ])
      .optional()
      .transform((v) => {
        if (v === undefined) return undefined;
        if (v === null || v === '') return null;
        return v.trim().toLowerCase();
      }),
    priority: z.enum(PRIORITIES).optional(),
    status: z.enum(STATUSES).optional(),
    assigneeId: z.number().int().positive().nullable().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const keys = Object.keys(data).filter(
      (k) => (data as Record<string, unknown>)[k] !== undefined,
    );
    if (keys.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Provide at least one field to update',
      });
    }
  });

const csvEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .string()
    .transform((s) => s.split(',').filter(Boolean))
    .pipe(z.array(z.enum(values)));

export const listTicketsQuerySchema = z.object({
  q: z.string().optional(),
  status: csvEnum(STATUSES).optional(),
  priority: csvEnum(PRIORITIES).optional(),
  assigneeId: z
    .union([z.literal('unassigned'), z.literal('me'), z.coerce.number().int().positive()])
    .optional(),
  overdue: z
    .literal('true')
    .optional()
    .transform((v) => v === 'true'),
  slaBreached: z
    .literal('true')
    .optional()
    .transform((v) => v === 'true'),
  sort: z.enum(['updated', 'priority', 'created']).optional().default('updated'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export type CreateTicketBody = z.infer<typeof createTicketBodySchema>;
export type PatchTicketBody = z.infer<typeof patchTicketBodySchema>;
export type ListTicketsQuery = z.infer<typeof listTicketsQuerySchema>;
