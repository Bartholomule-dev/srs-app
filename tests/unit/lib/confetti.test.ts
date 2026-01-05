// tests/unit/lib/confetti.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock canvas-confetti module - factory must not reference external variables
vi.mock('canvas-confetti', () => {
  const mockFn = vi.fn();
  const mockResetFn = vi.fn();
  return {
    default: Object.assign(mockFn, {
      reset: mockResetFn,
    }),
  };
});

import { fireConfetti, fireConfettiMini, resetConfetti } from '@/lib/confetti';
import confetti from 'canvas-confetti';

// Get references to the mocked functions
const mockConfetti = confetti as unknown as ReturnType<typeof vi.fn>;
const mockReset = (confetti as unknown as { reset: ReturnType<typeof vi.fn> }).reset;

describe('confetti utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfetti.mockClear();
    mockReset.mockClear();
  });

  describe('fireConfetti', () => {
    it('fires confetti with default options', () => {
      fireConfetti();
      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 100,
          spread: 60,
          origin: { y: 0.6 },
        })
      );
    });

    it('includes theme colors', () => {
      fireConfetti();
      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          colors: expect.arrayContaining(['#F59E0B', '#F97316', '#10B981']),
        })
      );
    });

    it('respects reduced motion preference', () => {
      fireConfetti();
      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          disableForReducedMotion: true,
        })
      );
    });

    it('fires enhanced confetti for perfect score', () => {
      fireConfetti(true);
      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 150,
          spread: 80,
        })
      );
    });

    it('fires additional side bursts for perfect score after delay', async () => {
      vi.useFakeTimers();

      fireConfetti(true);

      // Initial call
      expect(mockConfetti).toHaveBeenCalledTimes(1);

      // Advance time for side bursts
      await vi.advanceTimersByTimeAsync(250);

      // Should have 3 calls total (main + 2 side bursts)
      expect(mockConfetti).toHaveBeenCalledTimes(3);

      // Check left burst
      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          angle: 60,
          origin: { x: 0, y: 0.6 },
        })
      );

      // Check right burst
      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          angle: 120,
          origin: { x: 1, y: 0.6 },
        })
      );

      vi.useRealTimers();
    });
  });

  describe('fireConfettiMini', () => {
    it('fires mini confetti with small particle count', () => {
      fireConfettiMini();
      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          particleCount: 5,
          spread: 30,
        })
      );
    });

    it('uses default center origin', () => {
      fireConfettiMini();
      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: { x: 0.5, y: 0.5 },
        })
      );
    });

    it('accepts custom origin', () => {
      fireConfettiMini({ x: 0.3, y: 0.7 });
      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          origin: { x: 0.3, y: 0.7 },
        })
      );
    });

    it('uses smaller scalar for mini confetti', () => {
      fireConfettiMini();
      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          scalar: 0.8,
        })
      );
    });

    it('respects reduced motion preference', () => {
      fireConfettiMini();
      expect(mockConfetti).toHaveBeenCalledWith(
        expect.objectContaining({
          disableForReducedMotion: true,
        })
      );
    });
  });

  describe('resetConfetti', () => {
    it('calls confetti.reset()', () => {
      resetConfetti();
      expect(mockReset).toHaveBeenCalledTimes(1);
    });
  });
});
