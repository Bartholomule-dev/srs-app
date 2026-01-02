import { describe, it, expect } from 'vitest';
import {
  dbResult,
  isDbError,
  isDbSuccess,
  unwrapDbResult,
} from '@/lib/supabase/helpers';

describe('Database Helpers', () => {
  describe('dbResult', () => {
    it('wraps successful data', () => {
      const result = dbResult.ok({ id: '123' });
      expect(result.ok).toBe(true);
      expect(result.data).toEqual({ id: '123' });
    });

    it('wraps errors', () => {
      const result = dbResult.err('NOT_FOUND', 'Not found');
      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('converts Supabase errors', () => {
      const pgError = { code: '23505', message: 'duplicate', details: '', hint: '' } as any;
      const result = dbResult.fromSupabase(null, pgError);
      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe('23505');
    });

    it('converts Supabase success', () => {
      const result = dbResult.fromSupabase({ id: '123' }, null);
      expect(result.ok).toBe(true);
      expect(result.data).toEqual({ id: '123' });
    });
  });

  describe('type guards', () => {
    it('isDbError returns true for errors', () => {
      expect(isDbError(dbResult.err('E', 'e'))).toBe(true);
      expect(isDbError(dbResult.ok({}))).toBe(false);
    });

    it('isDbSuccess returns true for success', () => {
      expect(isDbSuccess(dbResult.ok({}))).toBe(true);
      expect(isDbSuccess(dbResult.err('E', 'e'))).toBe(false);
    });
  });

  describe('unwrapDbResult', () => {
    it('returns data on success', () => {
      expect(unwrapDbResult(dbResult.ok(42))).toBe(42);
    });

    it('throws on error', () => {
      expect(() => unwrapDbResult(dbResult.err('E', 'fail'))).toThrow('fail');
    });
  });
});
