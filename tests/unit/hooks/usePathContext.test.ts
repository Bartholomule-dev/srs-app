import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePathContext } from '@/lib/hooks/usePathContext';

// Mock the client-loader (this is what usePathContext actually uses)
vi.mock('@/lib/paths/client-loader', () => ({
  getPathIndex: vi.fn().mockResolvedValue({
    blueprints: new Map([
      [
        'bp-1',
        {
          id: 'bp-1',
          title: 'Test Blueprint',
          description: 'Test',
          difficulty: 'beginner',
          concepts: [],
          beats: [{ beat: 1, exercise: 'ex-a', title: 'Step 1' }],
        },
      ],
    ]),
    skins: new Map([
      [
        'skin-1',
        {
          id: 'skin-1',
          title: 'Test Skin',
          icon: '✅',
          blueprints: ['bp-1'],
          vars: {
            list_name: 'items',
            item_singular: 'item',
            item_plural: 'items',
            item_examples: [],
            record_keys: [],
          },
          contexts: { 'ex-a': 'Test context' },
        },
      ],
    ]),
    exerciseToBlueprints: new Map([
      ['ex-a', [{ blueprintId: 'bp-1', beat: 1, totalBeats: 1, beatTitle: 'Step 1' }]],
    ]),
    exerciseToSkins: new Map([['ex-a', ['skin-1']]]),
  }),
}));

describe('usePathContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads path index on mount', async () => {
    const { result } = renderHook(() => usePathContext());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.index).toBeDefined();
  });

  it('provides getSkinnedCard helper', async () => {
    const { result } = renderHook(() => usePathContext());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const card = result.current.getSkinnedCard('ex-a', []);

    expect(card.exerciseSlug).toBe('ex-a');
    expect(card.skinId).toBe('skin-1');
    expect(card.context).toBe('Test context');
  });

  it('returns minimal card when index not loaded', () => {
    const { result, unmount } = renderHook(() => usePathContext());

    // Before loading completes - getSkinnedCard returns minimal card
    const card = result.current.getSkinnedCard('ex-a', []);

    expect(card.exerciseSlug).toBe('ex-a');
    expect(card.skinId).toBeNull();

    // Unmount to prevent act() warning from async state update
    unmount();
  });

  it('includes blueprint info in skinned card', async () => {
    const { result } = renderHook(() => usePathContext());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const card = result.current.getSkinnedCard('ex-a', []);

    expect(card.blueprintId).toBe('bp-1');
    expect(card.beat).toBe(1);
    expect(card.totalBeats).toBe(1);
    expect(card.beatTitle).toBe('Step 1');
  });

  it('handles exercises not in any blueprint', async () => {
    const { result } = renderHook(() => usePathContext());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const card = result.current.getSkinnedCard('unknown-exercise', []);

    expect(card.exerciseSlug).toBe('unknown-exercise');
    expect(card.skinId).toBeNull();
    expect(card.blueprintId).toBeNull();
    expect(card.context).toBeNull();
  });

  it('has error state initially null', async () => {
    const { result } = renderHook(() => usePathContext());

    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
  });
});

describe('usePathContext - error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets error state when loading fails', async () => {
    const { getPathIndex } = await import('@/lib/paths/client-loader');
    vi.mocked(getPathIndex).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => usePathContext());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe('Network error');
  });
});
