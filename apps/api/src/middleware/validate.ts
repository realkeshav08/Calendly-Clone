import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';

type RequestPart = 'body' | 'query' | 'params';

/**
 * Returns middleware that validates one part of the request against a Zod schema.
 * On success the parsed (and coerced/defaulted) value replaces the original, so
 * downstream handlers receive clean, typed data. On failure the ZodError bubbles
 * to the central error handler, which formats it as a VALIDATION_ERROR.
 */
export function validate(schema: ZodSchema, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      next(result.error);
      return;
    }
    // query/params are read-only getters in Express 5-style typings; assign via cast.
    (req as Record<RequestPart, unknown>)[part] = result.data;
    next();
  };
}
