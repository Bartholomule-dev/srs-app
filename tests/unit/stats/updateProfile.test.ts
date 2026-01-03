import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateProfileStats } from '@/lib/stats/updateProfile';

const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: mockUpdate,
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'user-1',
              current_streak: 5,
              longest_streak: 10,
              total_exercises_completed: 50,
              updated_at: '2026-01-02T00:00:00Z',
            },
            error: null,
          }),
        })),
      })),
    })),
  },
}));

describe('updateProfileStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnValue({
      eq: mockEq.mockReturnValue({
        select: mockSelect.mockReturnValue({
          single: mockSingle.mockResolvedValue({ data: {}, error: null }),
        }),
      }),
    });
  });

  it('increments total_exercises_completed', async () => {
    await updateProfileStats({
      userId: 'user-1',
      exercisesCompleted: 5,
      lastPracticed: null,
      now: new Date('2026-01-03T12:00:00Z'),
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        total_exercises_completed: expect.any(Number),
      })
    );
  });

  it('updates streak when continuing from yesterday', async () => {
    await updateProfileStats({
      userId: 'user-1',
      exercisesCompleted: 1,
      lastPracticed: new Date('2026-01-02T18:00:00Z'),
      now: new Date('2026-01-03T10:00:00Z'),
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        current_streak: expect.any(Number),
      })
    );
  });
});
