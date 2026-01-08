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
  stability: null,
  prereqs: [],
  ...overrides,
});

describe('SubconceptNode', () => {
  it('renders as a 48px circle', () => {
    const { container } = render(<SubconceptNode node={makeNode()} />);

    const node = container.firstChild as HTMLElement;
    expect(node).toHaveClass('w-12', 'h-12'); // 48px = w-12 in Tailwind
    expect(node).toHaveClass('rounded-full');
  });

  describe('visual states', () => {
    it('renders locked state with muted styling', () => {
      render(<SubconceptNode node={makeNode({ state: 'locked' })} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('opacity-30');
    });

    it('renders available state with amber outline', () => {
      render(<SubconceptNode node={makeNode({ state: 'available' })} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('border-[var(--accent-primary)]');
      expect(button).toHaveClass('bg-transparent');
    });

    it('renders in-progress state with partial fill', () => {
      render(
        <SubconceptNode node={makeNode({ state: 'in-progress', stability: 3 })} />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-[var(--accent-primary)]/50');
    });

    it('renders mastered state with solid fill and glow', () => {
      render(
        <SubconceptNode node={makeNode({ state: 'mastered', stability: 10 })} />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-[var(--accent-primary)]');
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
});
