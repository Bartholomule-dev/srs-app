import type { PostgrestError } from '@supabase/supabase-js';

export interface DbError {
  code: string;
  message: string;
  details?: string;
}

export type DbResult<T> =
  | { ok: true; data: T; error?: undefined }
  | { ok: false; data?: undefined; error: DbError };

export const dbResult = {
  ok<T>(data: T): DbResult<T> {
    return { ok: true, data };
  },

  err<T = never>(code: string, message: string, details?: string): DbResult<T> {
    return { ok: false, error: { code, message, details } };
  },

  fromSupabase<T>(data: T | null, error: PostgrestError | null): DbResult<T> {
    if (error) {
      return {
        ok: false,
        error: { code: error.code, message: error.message, details: error.details },
      };
    }
    if (data === null) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'Resource not found' } };
    }
    return { ok: true, data };
  },
};

export function isDbError<T>(result: DbResult<T>): result is DbResult<T> & { ok: false } {
  return !result.ok;
}

export function isDbSuccess<T>(result: DbResult<T>): result is DbResult<T> & { ok: true } {
  return result.ok;
}

export function unwrapDbResult<T>(result: DbResult<T>): T {
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
