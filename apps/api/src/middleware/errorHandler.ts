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
 * Detects `http-errors`-style errors (thrown by Express middleware like body-parser:
 * 413 payload too large, 400 malformed JSON, 415 unsupported media type). They carry
 * a numeric `status`/`statusCode` and an `expose` flag indicating the message is safe
 * to show the client.
 */
function asHttpError(err: unknown): { status: number; message: string; expose: boolean } | null {
  if (typeof err !== 'object' || err === null) return null;
  const e = err as { status?: unknown; statusCode?: unknown; message?: unknown; expose?: unknown };
  const status = typeof e.statusCode === 'number' ? e.statusCode : e.status;
  if (typeof status !== 'number' || status < 400 || status > 599) return null;
  return {
    status,
    message: typeof e.message === 'string' ? e.message : 'Request error',
    expose: e.expose === true,
  };
}

/**
 * Central error middleware. Must be registered last. Normalizes known error types
 * (AppError, ZodError, Prisma errors) into a consistent JSON envelope and logs 5xx
 * errors with their stack. Never leaks stack traces to clients in production.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express needs the 4-arg signature to recognize this as an error handler.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
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
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      // Unique constraint violation (e.g. duplicate slug for a user).
      status = 409;
      body = {
        error: { code: 'CONFLICT', message: 'A record with these details already exists.' },
      };
    } else if (err.code === 'P2025') {
      // Operation targeted a row that doesn't exist (deleted or never existed).
      status = 404;
      body = { error: { code: 'NOT_FOUND', message: 'The requested record was not found.' } };
    } else if (err.code === 'P2003') {
      // Foreign-key constraint failed (e.g. referencing a missing schedule).
      status = 409;
      body = {
        error: { code: 'CONFLICT', message: 'This operation conflicts with related data.' },
      };
    }
  } else {
    // body-parser / http-errors (413 too large, 400 malformed JSON, 415, …).
    const httpErr = asHttpError(err);
    if (httpErr) {
      status = httpErr.status;
      body = {
        error: {
          code: status === 413 ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST',
          message: httpErr.expose ? httpErr.message : 'Request could not be processed.',
        },
      };
    }
  }

  if (status >= 500) {
    logger.error({ err }, 'Unhandled error');
    if (!isProduction && err instanceof Error) {
      body.error.message = err.message;
    }
  }

  res.status(status).json(body);
}
