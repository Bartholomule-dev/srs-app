import type { PostgrestError, AuthError } from '@supabase/supabase-js';
import { AppError, ErrorCode, type ErrorCodeType } from './AppError';

/**
 * Convert Supabase errors to user-friendly AppErrors
 */
export function handleSupabaseError(error: unknown): AppError {
  // Handle PostgrestError (database errors)
  if (isPostgrestError(error)) {
    return handlePostgrestError(error);
  }

  // Handle AuthError
  if (isAuthError(error)) {
    return handleAuthError(error);
  }

  // Handle generic errors
  if (error instanceof Error) {
    return new AppError(
      error.message || 'An unexpected error occurred',
      ErrorCode.UNKNOWN,
      error
    );
  }

  // Fallback for non-Error types
  return new AppError(
    'An unexpected error occurred',
    ErrorCode.UNKNOWN,
    undefined,
    { originalError: error }
  );
}

function isPostgrestError(error: unknown): error is PostgrestError {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  // PostgrestError has: code, details, hint, message, name='PostgrestError'
  // AuthError has: name containing 'Auth', status, code
  const hasPostgrestFields = 'code' in error && 'details' in error && 'hint' in error;
  const hasName = 'name' in error;
  const isAuthName = hasName && (error as { name: string }).name?.includes('Auth');

  return hasPostgrestFields && !isAuthName;
}

function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: string }).name?.includes('Auth')
  );
}

function handlePostgrestError(error: PostgrestError): AppError {
  const errorMappings: Record<string, { code: ErrorCodeType; message: string }> = {
    PGRST116: { code: ErrorCode.NOT_FOUND, message: 'Resource not found' },
    '42501': { code: ErrorCode.PERMISSION_DENIED, message: 'You do not have permission to perform this action' },
    '23505': { code: ErrorCode.VALIDATION_ERROR, message: 'A record with this value already exists' },
    '23503': { code: ErrorCode.VALIDATION_ERROR, message: 'Referenced record does not exist' },
    '23502': { code: ErrorCode.VALIDATION_ERROR, message: 'Required field is missing' },
    '22P02': { code: ErrorCode.VALIDATION_ERROR, message: 'Invalid input format' },
  };

  const mapping = errorMappings[error.code];
  if (mapping) {
    return new AppError(mapping.message, mapping.code, undefined, {
      originalCode: error.code,
      details: error.details,
    });
  }

  return new AppError(
    'A database error occurred',
    ErrorCode.DATABASE_ERROR,
    undefined,
    { originalCode: error.code, message: error.message }
  );
}

function handleAuthError(error: AuthError): AppError {
  const code = (error as { code?: string }).code || '';

  const errorMappings: Record<string, { code: ErrorCodeType; message: string }> = {
    invalid_credentials: { code: ErrorCode.AUTH_ERROR, message: 'Invalid credentials' },
    user_not_found: { code: ErrorCode.NOT_FOUND, message: 'User not found' },
    session_not_found: { code: ErrorCode.AUTH_ERROR, message: 'Your session has expired. Please sign in again.' },
    email_not_confirmed: { code: ErrorCode.AUTH_ERROR, message: 'Please confirm your email address' },
    invalid_token: { code: ErrorCode.AUTH_ERROR, message: 'Invalid or expired token' },
  };

  const mapping = errorMappings[code];
  if (mapping) {
    return new AppError(mapping.message, mapping.code, undefined, {
      originalCode: code,
    });
  }

  return new AppError(
    error.message || 'Authentication error',
    ErrorCode.AUTH_ERROR,
    undefined,
    { originalCode: code }
  );
}
