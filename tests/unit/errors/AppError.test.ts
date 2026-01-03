import { describe, it, expect } from 'vitest';
import { AppError, ErrorCode } from '@/lib/errors/AppError';

describe('AppError', () => {
  it('extends Error', () => {
    const error = new AppError('Test error', ErrorCode.UNKNOWN);
    expect(error).toBeInstanceOf(Error);
  });

  it('has code property', () => {
    const error = new AppError('Test', ErrorCode.AUTH_ERROR);
    expect(error.code).toBe(ErrorCode.AUTH_ERROR);
  });

  it('has message property', () => {
    const error = new AppError('Something went wrong', ErrorCode.UNKNOWN);
    expect(error.message).toBe('Something went wrong');
  });

  it('has optional cause', () => {
    const originalError = new Error('Original');
    const error = new AppError('Wrapped', ErrorCode.DATABASE_ERROR, originalError);
    expect(error.cause).toBe(originalError);
  });

  it('has optional context', () => {
    const error = new AppError('Test', ErrorCode.VALIDATION_ERROR, undefined, { field: 'email' });
    expect(error.context).toEqual({ field: 'email' });
  });

  it('has name set to AppError', () => {
    const error = new AppError('Test', ErrorCode.UNKNOWN);
    expect(error.name).toBe('AppError');
  });

  it('is JSON serializable', () => {
    const error = new AppError('Test error', ErrorCode.NETWORK_ERROR, undefined, { retry: true });
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'AppError',
      code: ErrorCode.NETWORK_ERROR,
      message: 'Test error',
      context: { retry: true },
    });
  });
});

describe('ErrorCode', () => {
  it('has expected error codes', () => {
    expect(ErrorCode.UNKNOWN).toBe('UNKNOWN');
    expect(ErrorCode.AUTH_ERROR).toBe('AUTH_ERROR');
    expect(ErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR');
    expect(ErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR');
    expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
    expect(ErrorCode.PERMISSION_DENIED).toBe('PERMISSION_DENIED');
  });
});
