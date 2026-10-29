import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/errors.js';

function zodDetails(error: ZodError): Record<string, string> {
  const details: Record<string, string> = {};
  for (const issue of error.issues) {
    let key = issue.path.length > 0 ? issue.path.join('.') : 'body';
    // Map customer refinement (empty path or custom) to "customer"
    if (
      issue.code === 'custom' &&
      (issue.path.length === 0 ||
        (issue.path.length === 1 &&
          (issue.path[0] === 'customerName' || issue.path[0] === 'customerEmail')))
    ) {
      if (
        issue.message.toLowerCase().includes('customer') ||
        issue.path[0] === 'customerName' ||
        issue.path[0] === 'customerEmail'
      ) {
        key = 'customer';
      }
    }
    if (issue.path[0] === 'customer') {
      key = 'customer';
    }
    if (!(key in details)) {
      details[key] = issue.message;
    }
  }
  return details;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: zodDetails(err),
      },
    });
    return;
  }

  if (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as { status?: number }).status === 400 &&
    'body' in err
  ) {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Malformed JSON body',
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Record not found',
      },
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    },
  });
}
