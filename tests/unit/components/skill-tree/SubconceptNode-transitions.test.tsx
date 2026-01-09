// tests/unit/components/skill-tree/SubconceptNode-transitions.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { SubconceptNode } from '@/components/skill-tree/SubconceptNode';
import type { SkillTreeNode } from '@/lib/skill-tree/types';
import type { BadgeTier } from '@/lib/gamification/badges';

const makeNode = (overrides: Partial<SkillTreeNode> = {}): SkillTreeNode => ({
  slug: 'variables',
  name: 'Variables',
  concept: 'foundations',
  state: 'available',
  badgeTier: 'available',
  stability: null,
  reps: 0,
  prereqs: [],
  ...overrides,
});

describe('SubconceptNode tier transitions', () => {
  describe('onTierUp callback', () => {
    it('fires onTierUp when tier upgrades from bronze to silver', async () => {
      const onTierUp = vi.fn();
      const { rerender } = render(
        <SubconceptNode
          node={makeNode({ state: 'in-progress', stability: 2 })}
          badgeTier="bronze"
          onTierUp={onTierUp}
        />
      );

      expect(onTierUp).not.toHaveBeenCalled();

      // Rerender with silver tier
      rerender(
        <SubconceptNode
          node={makeNode({ state: 'in-progress', stability: 7 })}
          badgeTier="silver"
          onTierUp={onTierUp}
        />
      );

      await waitFor(() => {
        expect(onTierUp).toHaveBeenCalledWith('bronze', 'silver');
      });
    });

    it('fires onTierUp when tier upgrades from available to bronze', async () => {
      const onTierUp = vi.fn();
      const { rerender } = render(
        <SubconceptNode
          node={makeNode({ state: 'available' })}
          badgeTier="available"
          onTierUp={onTierUp}
        />
      );

      expect(onTierUp).not.toHaveBeenCalled();

      // Rerender with bronze tier
      rerender(
        <SubconceptNode
          node={makeNode({ state: 'in-progress', stability: 1 })}
          badgeTier="bronze"
          onTierUp={onTierUp}
        />
      );

      await waitFor(() => {
        expect(onTierUp).toHaveBeenCalledWith('available', 'bronze');
      });
    });

    it('fires onTierUp when tier upgrades from silver to gold', async () => {
      const onTierUp = vi.fn();
      const { rerender } = render(
        <SubconceptNode
          node={makeNode({ state: 'in-progress', stability: 7 })}
          badgeTier="silver"
          onTierUp={onTierUp}
        />
      );

      // Rerender with gold tier
      rerender(
        <SubconceptNode
          node={makeNode({ state: 'mastered', stability: 30 })}
          badgeTier="gold"
          onTierUp={onTierUp}
        />
      );

      await waitFor(() => {
        expect(onTierUp).toHaveBeenCalledWith('silver', 'gold');
      });
    });

    it('fires onTierUp when tier upgrades from gold to platinum', async () => {
      const onTierUp = vi.fn();
      const { rerender } = render(
        <SubconceptNode
          node={makeNode({ state: 'mastered', stability: 30 })}
          badgeTier="gold"
          onTierUp={onTierUp}
        />
      );

      // Rerender with platinum tier
      rerender(
        <SubconceptNode
          node={makeNode({ state: 'mastered', stability: 90 })}
          badgeTier="platinum"
          onTierUp={onTierUp}
        />
      );

      await waitFor(() => {
        expect(onTierUp).toHaveBeenCalledWith('gold', 'platinum');
      });
    });

    it('does not fire onTierUp on initial render', () => {
      const onTierUp = vi.fn();
      render(
        <SubconceptNode
          node={makeNode({ state: 'in-progress', stability: 2 })}
          badgeTier="bronze"
          onTierUp={onTierUp}
        />
      );

      expect(onTierUp).not.toHaveBeenCalled();
    });

    it('does not fire onTierUp when tier stays the same', async () => {
      const onTierUp = vi.fn();
      const { rerender } = render(
        <SubconceptNode
          node={makeNode({ state: 'in-progress', stability: 2 })}
          badgeTier="bronze"
          onTierUp={onTierUp}
        />
      );

      // Rerender with same tier
      rerender(
        <SubconceptNode
          node={makeNode({ state: 'in-progress', stability: 3 })}
          badgeTier="bronze"
          onTierUp={onTierUp}
        />
      );

      // Wait a tick to ensure no async calls
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(onTierUp).not.toHaveBeenCalled();
    });

    it('does not fire onTierUp when tier downgrades', async () => {
      const onTierUp = vi.fn();
      const { rerender } = render(
        <SubconceptNode
          node={makeNode({ state: 'in-progress', stability: 7 })}
          badgeTier="silver"
          onTierUp={onTierUp}
        />
      );

      // Rerender with lower tier (hypothetical downgrade)
      rerender(
        <SubconceptNode
          node={makeNode({ state: 'in-progress', stability: 2 })}
          badgeTier="bronze"
          onTierUp={onTierUp}
        />
      );

      // Wait a tick to ensure no async calls
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(onTierUp).not.toHaveBeenCalled();
    });

    it('does not fire when onTierUp is not provided', () => {
      const { rerender } = render(
        <SubconceptNode
          node={makeNode({ state: 'in-progress', stability: 2 })}
          badgeTier="bronze"
        />
      );

      // Rerender with silver tier - should not throw
      expect(() =>
        rerender(
          <SubconceptNode
            node={makeNode({ state: 'in-progress', stability: 7 })}
            badgeTier="silver"
          />
        )
      ).not.toThrow();
    });
  });

  describe('ring color transition animation', () => {
    it('adds transition animation class when tier changes', async () => {
      const { rerender, container } = render(
        <SubconceptNode
          node={makeNode({ state: 'in-progress', stability: 2 })}
          badgeTier="bronze"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('ring-amber-600');

      // Rerender with silver tier
      rerender(
        <SubconceptNode
          node={makeNode({ state: 'in-progress', stability: 7 })}
          badgeTier="silver"
        />
      );

      // Button should now have silver ring color
      await waitFor(() => {
        expect(button).toHaveClass('ring-slate-300');
      });

      // Check for transition animation marker
      const animationMarker = container.querySelector('[data-tier-transitioning="true"]');
      expect(animationMarker).toBeInTheDocument();
    });

    it('applies correct ring colors for each tier', () => {
      const tierRingColors: Record<BadgeTier, string> = {
        locked: 'ring-bg-surface-2',
        available: 'ring-accent-primary/30',
        bronze: 'ring-amber-600',
        silver: 'ring-slate-300',
        gold: 'ring-yellow-400',
        platinum: 'ring-cyan-300',
      };

      Object.entries(tierRingColors).forEach(([tier, expectedClass]) => {
        const { unmount } = render(
          <SubconceptNode
            node={makeNode({ state: 'mastered', stability: 90 })}
            badgeTier={tier as BadgeTier}
          />
        );

        const button = screen.getByRole('button');
        expect(button).toHaveClass(expectedClass);
        unmount();
      });
    });
  });

  describe('platinum tier shine animation', () => {
    it('renders data-platinum attribute for platinum tier', () => {
      const { container } = render(
        <SubconceptNode
          node={makeNode({ state: 'mastered', stability: 90 })}
          badgeTier="platinum"
        />
      );

      const platinumMarker = container.querySelector('[data-platinum="true"]');
      expect(platinumMarker).toBeInTheDocument();
    });

    it('does not render data-platinum attribute for non-platinum tiers', () => {
      const nonPlatinumTiers: BadgeTier[] = ['locked', 'available', 'bronze', 'silver', 'gold'];

      nonPlatinumTiers.forEach((tier) => {
        const { container, unmount } = render(
          <SubconceptNode
            node={makeNode({ state: 'mastered', stability: 90 })}
            badgeTier={tier}
          />
        );

        const platinumMarker = container.querySelector('[data-platinum="true"]');
        expect(platinumMarker).not.toBeInTheDocument();
        unmount();
      });
    });

    it('applies shine animation class to platinum tier', () => {
      const { container } = render(
        <SubconceptNode
          node={makeNode({ state: 'mastered', stability: 90 })}
          badgeTier="platinum"
        />
      );

      // Check for either a CSS animation class or the shimmer animation overlay
      const shineElement = container.querySelector('[data-tier-animation="platinum"]');
      expect(shineElement).toBeInTheDocument();
    });

    it('platinum tier has the existing shimmer animation overlay', () => {
      const { container } = render(
        <SubconceptNode
          node={makeNode({ state: 'mastered', stability: 90 })}
          badgeTier="platinum"
        />
      );

      // Verify the shimmer overlay exists (already implemented from previous phase)
      const shimmerOverlay = container.querySelector('[data-tier-animation="platinum"]');
      expect(shimmerOverlay).toBeInTheDocument();
      expect(shimmerOverlay).toHaveClass('pointer-events-none');
    });
  });

  describe('transition timing', () => {
    it('sets isTransitioning on tier upgrade', async () => {
      const { rerender, container } = render(
        <SubconceptNode
          node={makeNode({ state: 'in-progress', stability: 2 })}
          badgeTier="bronze"
        />
      );

      // No transition marker on initial render
      expect(container.querySelector('[data-tier-transitioning="true"]')).not.toBeInTheDocument();

      // Rerender with silver tier
      rerender(
        <SubconceptNode
          node={makeNode({ state: 'in-progress', stability: 7 })}
          badgeTier="silver"
        />
      );

      // Transition marker should be present after tier upgrade
      await waitFor(() => {
        expect(container.querySelector('[data-tier-transitioning="true"]')).toBeInTheDocument();
      });
    });

    it('schedules timeout to clear isTransitioning after TIER_TRANSITION_DURATION', async () => {
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

      const { rerender } = render(
        <SubconceptNode
          node={makeNode({ state: 'in-progress', stability: 2 })}
          badgeTier="bronze"
        />
      );

      const initialCalls = setTimeoutSpy.mock.calls.length;

      // Rerender with silver tier
      rerender(
        <SubconceptNode
          node={makeNode({ state: 'in-progress', stability: 7 })}
          badgeTier="silver"
        />
      );

      // A new setTimeout should have been called for the transition
      await waitFor(() => {
        expect(setTimeoutSpy.mock.calls.length).toBeGreaterThan(initialCalls);
      });

      // Find the call with 500ms duration (TIER_TRANSITION_DURATION)
      const transitionTimeoutCall = setTimeoutSpy.mock.calls.find(
        (call) => call[1] === 500
      );
      expect(transitionTimeoutCall).toBeDefined();

      setTimeoutSpy.mockRestore();
    });

    it('does not set isTransitioning on downgrade', async () => {
      const { rerender, container } = render(
        <SubconceptNode
          node={makeNode({ state: 'in-progress', stability: 7 })}
          badgeTier="silver"
        />
      );

      // Rerender with bronze tier (downgrade)
      rerender(
        <SubconceptNode
          node={makeNode({ state: 'in-progress', stability: 2 })}
          badgeTier="bronze"
        />
      );

      // Transition marker should NOT be present for downgrades
      await new Promise((r) => setTimeout(r, 50));
      expect(container.querySelector('[data-tier-transitioning="true"]')).not.toBeInTheDocument();
    });
  });
});
