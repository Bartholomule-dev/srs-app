export const ErrorCode = {
  UNKNOWN: 'UNKNOWN',
  AUTH_ERROR: 'AUTH_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  SRS_ERROR: 'SRS_ERROR',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ErrorContext {
  [key: string]: unknown;
}

export class AppError extends Error {
  public readonly code: ErrorCodeType;
  public readonly context?: ErrorContext;

  constructor(
    message: string,
    code: ErrorCodeType,
    cause?: Error,
    context?: ErrorContext
  ) {
    super(message, { cause });
    this.name = 'AppError';
    this.code = code;
    this.context = context;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
    };
  }
}
