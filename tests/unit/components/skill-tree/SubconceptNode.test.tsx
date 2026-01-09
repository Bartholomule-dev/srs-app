// tests/unit/components/skill-tree/SubconceptNode.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubconceptNode } from '@/components/skill-tree/SubconceptNode';
import type { SkillTreeNode } from '@/lib/skill-tree/types';

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

describe('SubconceptNode', () => {
  it('renders as a 48px circle with 44px touch target', () => {
    const { container } = render(<SubconceptNode node={makeNode()} />);

    // The wrapper div provides 44px touch target (accessibility guideline)
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('min-w-[44px]', 'min-h-[44px]');
    expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');

    // The button is the visual 48px circle
    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-12', 'h-12'); // 48px = w-12 in Tailwind
    expect(button).toHaveClass('rounded-full');
    expect(button).toHaveClass('touch-manipulation'); // Improved touch handling
  });

  describe('visual states', () => {
    it('renders locked state with muted styling', () => {
      render(<SubconceptNode node={makeNode({ state: 'locked' })} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('opacity-40');
      expect(button).toHaveClass('cursor-not-allowed');
    });

    it('renders available state with accent border', () => {
      render(<SubconceptNode node={makeNode({ state: 'available' })} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-2');
      expect(button).toHaveClass('border-[var(--accent-primary)]');
    });

    it('renders in-progress state with thicker border', () => {
      render(
        <SubconceptNode node={makeNode({ state: 'in-progress', stability: 3 })} />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-[3px]');
      expect(button).toHaveClass('border-[var(--accent-primary)]');
    });

    it('renders mastered state with emerald fill', () => {
      render(
        <SubconceptNode node={makeNode({ state: 'mastered', stability: 10 })} />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-emerald-500');
      expect(button).toHaveClass('bg-emerald-500/20');
    });
  });

  describe('tooltip', () => {
    it('shows tooltip on hover', async () => {
      const user = userEvent.setup();
      render(<SubconceptNode node={makeNode({ name: 'Variables' })} />);

      const node = screen.getByRole('button');
      await user.hover(node);

      expect(await screen.findByText('Variables')).toBeInTheDocument();
    });

    it('shows "Ready to learn" for available state', async () => {
      const user = userEvent.setup();
      render(<SubconceptNode node={makeNode({ state: 'available' })} />);

      const node = screen.getByRole('button');
      await user.hover(node);

      expect(await screen.findByText('Ready to learn')).toBeInTheDocument();
    });

    it('shows prereqs for locked state', async () => {
      const user = userEvent.setup();
      render(
        <SubconceptNode
          node={makeNode({
            state: 'locked',
            prereqs: ['basics', 'operators'],
          })}
          prereqNames={{ basics: 'String Basics', operators: 'Operators' }}
        />
      );

      const node = screen.getByRole('button');
      await user.hover(node);

      expect(await screen.findByText(/Requires:/)).toBeInTheDocument();
    });

    it('shows stability for in-progress state', async () => {
      const user = userEvent.setup();
      render(
        <SubconceptNode node={makeNode({ state: 'in-progress', stability: 3.5 })} />
      );

      const node = screen.getByRole('button');
      await user.hover(node);

      expect(await screen.findByText(/3.5 days/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has button role', () => {
      render(<SubconceptNode node={makeNode()} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('has accessible name', () => {
      render(<SubconceptNode node={makeNode({ name: 'Variables' })} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAccessibleName('Variables');
    });

    it('is focusable', () => {
      render(<SubconceptNode node={makeNode()} />);

      const node = screen.getByRole('button');
      node.focus();
      expect(node).toHaveFocus();
    });
  });

  describe('badge tiers', () => {
    it('renders locked badge tier with muted ring styling', () => {
      render(
        <SubconceptNode
          node={makeNode({ state: 'locked' })}
          badgeTier="locked"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('ring-bg-surface-2');
      expect(button).toHaveClass('bg-bg-surface-2');
    });

    it('renders available badge tier with accent ring', () => {
      render(
        <SubconceptNode
          node={makeNode({ state: 'available' })}
          badgeTier="available"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('ring-accent-primary/30');
      expect(button).toHaveClass('bg-bg-surface-1');
    });

    it('renders bronze badge tier with amber ring', () => {
      render(
        <SubconceptNode
          node={makeNode({ state: 'in-progress', stability: 2 })}
          badgeTier="bronze"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('ring-amber-600');
      expect(button).toHaveClass('bg-amber-900/20');
    });

    it('renders silver badge tier with slate ring and glow', () => {
      render(
        <SubconceptNode
          node={makeNode({ state: 'in-progress', stability: 7 })}
          badgeTier="silver"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('ring-slate-300');
      expect(button).toHaveClass('bg-slate-600/20');
      // Check for glow effect
      expect(button.className).toContain('shadow-[0_0_8px');
    });

    it('renders gold badge tier with yellow ring and glow', () => {
      render(
        <SubconceptNode
          node={makeNode({ state: 'mastered', stability: 30 })}
          badgeTier="gold"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('ring-yellow-400');
      expect(button).toHaveClass('bg-yellow-700/20');
      // Check for glow effect
      expect(button.className).toContain('shadow-[0_0_12px');
    });

    it('renders platinum badge tier with cyan ring and glow', () => {
      render(
        <SubconceptNode
          node={makeNode({ state: 'mastered', stability: 90 })}
          badgeTier="platinum"
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('ring-cyan-300');
      expect(button).toHaveClass('bg-cyan-700/20');
      // Check for glow effect
      expect(button.className).toContain('shadow-[0_0_16px');
    });

    it('uses default state styling when no badgeTier provided', () => {
      render(<SubconceptNode node={makeNode({ state: 'available' })} />);

      const button = screen.getByRole('button');
      // Should use original state-based styling, not badge tier
      expect(button).toHaveClass('border-[var(--accent-primary)]');
    });

    it('badge tier overrides default state styling when provided', () => {
      render(
        <SubconceptNode
          node={makeNode({ state: 'available' })}
          badgeTier="bronze"
        />
      );

      const button = screen.getByRole('button');
      // Should use badge tier styling, not state-based styling
      expect(button).toHaveClass('ring-amber-600');
      // Should NOT have the default available state border
      expect(button).not.toHaveClass('border-[var(--accent-primary)]');
    });

    it.each([
      ['silver', 'shadow-[0_0_8px'],
      ['gold', 'shadow-[0_0_12px'],
      ['platinum', 'shadow-[0_0_16px'],
    ] as const)(
      'applies glow effect for %s tier',
      (tier: 'silver' | 'gold' | 'platinum', expectedGlow: string) => {
        render(
          <SubconceptNode
            node={makeNode({ state: 'mastered' })}
            badgeTier={tier}
          />
        );

        const button = screen.getByRole('button');
        expect(button.className).toContain(expectedGlow);
      }
    );

    it('does not apply glow for bronze tier', () => {
      render(
        <SubconceptNode
          node={makeNode({ state: 'in-progress' })}
          badgeTier="bronze"
        />
      );

      const button = screen.getByRole('button');
      expect(button.className).not.toContain('shadow-[0_0_');
    });
  });

  describe('badge tier animations', () => {
    it('renders data-badge-tier attribute when badgeTier is provided', () => {
      const { container } = render(
        <SubconceptNode
          node={makeNode({ state: 'available' })}
          badgeTier="available"
        />
      );

      const wrapper = container.querySelector('[data-badge-tier="available"]');
      expect(wrapper).toBeInTheDocument();
    });

    it('renders pulse animation overlay for available tier', () => {
      const { container } = render(
        <SubconceptNode
          node={makeNode({ state: 'available' })}
          badgeTier="available"
        />
      );

      const animationOverlay = container.querySelector('[data-tier-animation="available"]');
      expect(animationOverlay).toBeInTheDocument();
    });

    it('renders shimmer animation overlay for platinum tier', () => {
      const { container } = render(
        <SubconceptNode
          node={makeNode({ state: 'mastered', stability: 90 })}
          badgeTier="platinum"
        />
      );

      const animationOverlay = container.querySelector('[data-tier-animation="platinum"]');
      expect(animationOverlay).toBeInTheDocument();
    });

    it('does not render animation overlay for bronze tier', () => {
      const { container } = render(
        <SubconceptNode
          node={makeNode({ state: 'in-progress', stability: 2 })}
          badgeTier="bronze"
        />
      );

      const animationOverlay = container.querySelector('[data-tier-animation]');
      expect(animationOverlay).not.toBeInTheDocument();
    });

    it('does not render animation overlay for silver tier', () => {
      const { container } = render(
        <SubconceptNode
          node={makeNode({ state: 'in-progress', stability: 7 })}
          badgeTier="silver"
        />
      );

      const animationOverlay = container.querySelector('[data-tier-animation]');
      expect(animationOverlay).not.toBeInTheDocument();
    });

    it('does not render animation overlay for gold tier', () => {
      const { container } = render(
        <SubconceptNode
          node={makeNode({ state: 'mastered', stability: 30 })}
          badgeTier="gold"
        />
      );

      const animationOverlay = container.querySelector('[data-tier-animation]');
      expect(animationOverlay).not.toBeInTheDocument();
    });

    it('does not render animation overlay for locked tier', () => {
      const { container } = render(
        <SubconceptNode
          node={makeNode({ state: 'locked' })}
          badgeTier="locked"
        />
      );

      const animationOverlay = container.querySelector('[data-tier-animation]');
      expect(animationOverlay).not.toBeInTheDocument();
    });

    it('does not render animation overlay when no badgeTier provided', () => {
      const { container } = render(
        <SubconceptNode node={makeNode({ state: 'available' })} />
      );

      const animationOverlay = container.querySelector('[data-tier-animation]');
      expect(animationOverlay).not.toBeInTheDocument();
    });

    it('uses motion.button component for animation capabilities', () => {
      const { container } = render(
        <SubconceptNode
          node={makeNode({ state: 'available' })}
          badgeTier="available"
        />
      );

      // motion.button should render a button element
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      // The button should be inside the wrapper div
      expect(container.querySelector('[data-badge-tier]')).toContainElement(button);
    });
  });
});
