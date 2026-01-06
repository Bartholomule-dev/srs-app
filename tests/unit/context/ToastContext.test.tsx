// tests/unit/context/ToastContext.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ToastProvider, useToast } from '@/lib/context/ToastContext';
import type { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('useToast', () => {
    it('throws when used outside ToastProvider', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useToast());
      }).toThrow('useToast must be used within a ToastProvider');

      spy.mockRestore();
    });

    it('returns empty toasts array initially', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      expect(result.current.toasts).toEqual([]);
    });

    it('provides showToast and dismissToast functions', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      expect(typeof result.current.showToast).toBe('function');
      expect(typeof result.current.dismissToast).toBe('function');
    });
  });

  describe('showToast', () => {
    it('adds a toast with required fields', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ title: 'Test Toast' });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        title: 'Test Toast',
        variant: 'info',
      });
      expect(result.current.toasts[0].id).toBeDefined();
    });

    it('adds a toast with all optional fields', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({
          title: 'Success Toast',
          description: 'Operation completed',
          variant: 'success',
          duration: 3000,
        });
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        title: 'Success Toast',
        description: 'Operation completed',
        variant: 'success',
        duration: 3000,
      });
    });

    it('supports all variant types', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      const variants = ['success', 'error', 'warning', 'info'] as const;

      variants.forEach((variant) => {
        act(() => {
          result.current.showToast({ title: `${variant} toast`, variant });
        });
      });

      expect(result.current.toasts).toHaveLength(4);
      variants.forEach((variant, index) => {
        expect(result.current.toasts[index].variant).toBe(variant);
      });
    });

    it('generates unique IDs for each toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ title: 'Toast 1' });
        result.current.showToast({ title: 'Toast 2' });
        result.current.showToast({ title: 'Toast 3' });
      });

      const ids = result.current.toasts.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });
  });

  describe('dismissToast', () => {
    it('removes a toast by ID', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ title: 'Toast 1' });
        result.current.showToast({ title: 'Toast 2' });
      });

      const toastId = result.current.toasts[0].id;

      act(() => {
        result.current.dismissToast(toastId);
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].title).toBe('Toast 2');
    });

    it('does nothing when dismissing non-existent toast', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ title: 'Toast 1' });
      });

      act(() => {
        result.current.dismissToast('non-existent-id');
      });

      expect(result.current.toasts).toHaveLength(1);
    });
  });

  describe('auto-dismiss', () => {
    it('auto-dismisses toast after default duration (5000ms)', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ title: 'Auto-dismiss Toast' });
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(4999);
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('auto-dismisses toast after custom duration', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ title: 'Custom Duration', duration: 2000 });
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('clears timer when manually dismissed before auto-dismiss', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ title: 'Manual Dismiss', duration: 5000 });
      });

      const toastId = result.current.toasts[0].id;

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      act(() => {
        result.current.dismissToast(toastId);
      });

      expect(result.current.toasts).toHaveLength(0);

      // Advance past original auto-dismiss time - should not cause errors
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('cleanup', () => {
    it('clears all timers on unmount', () => {
      const { result, unmount } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ title: 'Toast 1', duration: 10000 });
        result.current.showToast({ title: 'Toast 2', duration: 10000 });
      });

      expect(result.current.toasts).toHaveLength(2);

      unmount();

      // Should not throw or cause memory leaks
      act(() => {
        vi.advanceTimersByTime(15000);
      });
    });
  });
});
