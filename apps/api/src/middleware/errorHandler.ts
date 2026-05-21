import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';
import { isProduction } from '../config/env';

/** Shape every error response shares, so the client can branch on `error.code`. */
interface ErrorBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

/**
 * Central error middleware. Must be registered last. Normalizes known error types
 * (AppError, ZodError, Prisma errors) into a consistent JSON envelope and logs 5xx
 * errors with their stack. Never leaks stack traces to clients in production.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express needs the 4-arg signature to recognize this as an error handler.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  let status = 500;
  let body: ErrorBody = {
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' },
  };

  if (err instanceof AppError) {
    status = err.statusCode;
    body = { error: { code: err.code, message: err.message, fields: err.fields } };
  } else if (err instanceof ZodError) {
    status = 400;
    const fields: Record<string, string> = {};
    for (const issue of err.errors) {
      fields[issue.path.join('.') || '_'] = issue.message;
    }
    body = { error: { code: 'VALIDATION_ERROR', message: 'Validation failed', fields } };
  } else if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    // Unique constraint violation (e.g. duplicate slug for a user).
    status = 409;
    body = { error: { code: 'CONFLICT', message: 'A record with these details already exists.' } };
  }

  if (status >= 500) {
    logger.error({ err }, 'Unhandled error');
    if (!isProduction && err instanceof Error) {
      body.error.message = err.message;
    }
  }

  res.status(status).json(body);
}
