import { describe, it, expect } from 'vitest';
import { handleSupabaseError } from '@/lib/errors/handleSupabaseError';
import { AppError, ErrorCode } from '@/lib/errors/AppError';
import type { PostgrestError, AuthError } from '@supabase/supabase-js';

describe('handleSupabaseError', () => {
  describe('PostgrestError handling', () => {
    it('converts PGRST116 (no rows) to NOT_FOUND', () => {
      const pgError: PostgrestError = {
        name: 'PostgrestError',
        message: 'No rows found',
        details: '',
        hint: '',
        code: 'PGRST116',
      };

      const result = handleSupabaseError(pgError);

      expect(result).toBeInstanceOf(AppError);
      expect(result.code).toBe(ErrorCode.NOT_FOUND);
      expect(result.message).toBe('Resource not found');
    });

    it('converts 42501 (permission denied) to PERMISSION_DENIED', () => {
      const pgError: PostgrestError = {
        name: 'PostgrestError',
        message: 'permission denied for table',
        details: '',
        hint: '',
        code: '42501',
      };

      const result = handleSupabaseError(pgError);

      expect(result.code).toBe(ErrorCode.PERMISSION_DENIED);
      expect(result.message).toBe('You do not have permission to perform this action');
    });

    it('converts 23505 (unique violation) to VALIDATION_ERROR', () => {
      const pgError: PostgrestError = {
        name: 'PostgrestError',
        message: 'duplicate key value violates unique constraint',
        details: 'Key (email)=(test@example.com) already exists.',
        hint: '',
        code: '23505',
      };

      const result = handleSupabaseError(pgError);

      expect(result.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(result.message).toBe('A record with this value already exists');
    });

    it('converts unknown codes to DATABASE_ERROR', () => {
      const pgError: PostgrestError = {
        name: 'PostgrestError',
        message: 'Something unexpected',
        details: '',
        hint: '',
        code: '99999',
      };

      const result = handleSupabaseError(pgError);

      expect(result.code).toBe(ErrorCode.DATABASE_ERROR);
    });
  });

  describe('AuthError handling', () => {
    it('converts invalid_credentials to AUTH_ERROR', () => {
      const authError = {
        name: 'AuthApiError',
        message: 'Invalid login credentials',
        status: 400,
        code: 'invalid_credentials',
      } as AuthError;

      const result = handleSupabaseError(authError);

      expect(result.code).toBe(ErrorCode.AUTH_ERROR);
      expect(result.message).toBe('Invalid credentials');
    });

    it('converts user_not_found to NOT_FOUND', () => {
      const authError = {
        name: 'AuthApiError',
        message: 'User not found',
        status: 404,
        code: 'user_not_found',
      } as AuthError;

      const result = handleSupabaseError(authError);

      expect(result.code).toBe(ErrorCode.NOT_FOUND);
    });

    it('converts session_not_found to AUTH_ERROR', () => {
      const authError = {
        name: 'AuthApiError',
        message: 'Session not found',
        status: 401,
        code: 'session_not_found',
      } as AuthError;

      const result = handleSupabaseError(authError);

      expect(result.code).toBe(ErrorCode.AUTH_ERROR);
      expect(result.message).toBe('Your session has expired. Please sign in again.');
    });
  });

  describe('Generic error handling', () => {
    it('wraps unknown errors as UNKNOWN', () => {
      const error = new Error('Something broke');

      const result = handleSupabaseError(error);

      expect(result.code).toBe(ErrorCode.UNKNOWN);
      expect(result.cause).toBe(error);
    });

    it('preserves original error as cause', () => {
      const original = new Error('Original');

      const result = handleSupabaseError(original);

      expect(result.cause).toBe(original);
    });
  });
});
