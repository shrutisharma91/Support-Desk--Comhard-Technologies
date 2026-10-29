export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'INVALID_CREDENTIALS'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: Record<string, string>;

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    details?: Record<string, string>,
  ) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function badRequest(message: string, details?: Record<string, string>): AppError {
  return new AppError(400, 'BAD_REQUEST', message, details);
}

export function validation(
  message = 'Validation failed',
  details?: Record<string, string>,
): AppError {
  return new AppError(400, 'VALIDATION_ERROR', message, details);
}

export function unauthorized(message = 'Unauthorized'): AppError {
  return new AppError(401, 'UNAUTHORIZED', message);
}

export function invalidCredentials(
  message = 'Invalid email or password',
): AppError {
  return new AppError(401, 'INVALID_CREDENTIALS', message);
}

export function forbidden(message = 'Forbidden'): AppError {
  return new AppError(403, 'FORBIDDEN', message);
}

export function notFound(message: string): AppError {
  return new AppError(404, 'NOT_FOUND', message);
}
