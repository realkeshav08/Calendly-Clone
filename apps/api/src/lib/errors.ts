/**
 * Application error type carrying an HTTP status and a stable machine-readable
 * `code`. Throwing these anywhere in a service lets the central error middleware
 * translate them into a consistent JSON response without leaking internals.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    /** Optional per-field details, surfaced for validation errors. */
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace?.(this, AppError);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', fields?: Record<string, string>) {
    super(400, 'VALIDATION_ERROR', message, fields);
  }
}

/** Thrown when a booking slot was taken between slot lookup and commit. */
export class ConflictError extends AppError {
  constructor(message = 'This slot was just taken — please pick another time.') {
    super(409, 'CONFLICT', message);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(400, 'BAD_REQUEST', message);
  }
}
