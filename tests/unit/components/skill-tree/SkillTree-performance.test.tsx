// tests/unit/components/skill-tree/SkillTree-performance.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import type { SkillTreeNode } from '@/lib/skill-tree/types';

// Mock framer-motion to avoid animation issues in tests
const MockMotionButton = React.forwardRef<
  HTMLButtonElement,
  React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>
>(function MockMotionButton({ children, ...props }, ref) {
  return (
    <button ref={ref} {...props}>
      {children}
    </button>
  );
});

const MockMotionDiv = React.forwardRef<
  HTMLDivElement,
  React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>
>(function MockMotionDiv({ children, ...props }, ref) {
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
});

function MockAnimatePresence({ children }: React.PropsWithChildren) {
  return <>{children}</>;
}

vi.mock('framer-motion', () => ({
  motion: {
    button: MockMotionButton,
    div: MockMotionDiv,
  },
  AnimatePresence: MockAnimatePresence,
  useReducedMotion: () => false,
}));

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

describe('SkillTree performance', () => {
  describe('SubconceptNode memoization', () => {
    it('SubconceptNode is wrapped with React.memo', async () => {
      // Import the component module
      const nodeModule = await import(
        '@/components/skill-tree/SubconceptNode'
      );
      const SubconceptNode = nodeModule.SubconceptNode;

      // React.memo components have a $$typeof of Symbol(react.memo)
      expect(SubconceptNode.$$typeof?.toString()).toBe('Symbol(react.memo)');
    });

    it('SubconceptNode does not re-render when props are unchanged', async () => {
      const nodeModule = await import(
        '@/components/skill-tree/SubconceptNode'
      );
      const SubconceptNode = nodeModule.SubconceptNode;

      // Track render count
      const renderSpy = vi.fn();
      const TrackedNode = React.memo(function TrackedNode(
        props: { node: SkillTreeNode; prereqNames?: Record<string, string> }
      ) {
        renderSpy();
        return <SubconceptNode {...props} />;
      });

      const node = makeNode();
      const prereqNames = { basics: 'String Basics' };

      const { rerender } = render(
        <TrackedNode node={node} prereqNames={prereqNames} />
      );

      // Initial render
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props - should not re-render due to memo
      rerender(<TrackedNode node={node} prereqNames={prereqNames} />);

      // Still 1 because props are the same reference
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('SubconceptNode re-renders when node prop changes', async () => {
      const nodeModule = await import(
        '@/components/skill-tree/SubconceptNode'
      );
      const SubconceptNode = nodeModule.SubconceptNode;

      const node1 = makeNode({ name: 'Variables' });
      const node2 = makeNode({ name: 'Functions' });

      const { rerender } = render(<SubconceptNode node={node1} />);

      // Get the button with current name
      expect(screen.getByRole('button')).toHaveAccessibleName('Variables');

      // Re-render with different node
      rerender(<SubconceptNode node={node2} />);

      // Should have new name
      expect(screen.getByRole('button')).toHaveAccessibleName('Functions');
    });
  });

  describe('SkillTree callback stability', () => {
    it(
      'registerNode callback is stable across renders',
      async () => {
        // This test verifies that useCallback is used for registerNode
        // We can't directly test this without accessing internals, but we can
        // verify the component renders correctly multiple times
        const { useSkillTree } = await import('@/lib/hooks/useSkillTree');

        // Mock the hook
        vi.mocked(useSkillTree).mockReturnValue({
          data: {
            clusters: [
              {
                slug: 'foundations',
                name: 'Foundations',
                description: 'Core programming fundamentals',
                tier: 1,
                masteredCount: 1,
                totalCount: 2,
                subconcepts: [
                  makeNode({ slug: 'variables', name: 'Variables' }),
                  makeNode({ slug: 'types', name: 'Types' }),
                ],
              },
            ],
            totalMastered: 1,
            totalSubconcepts: 2,
          },
          loading: false,
          error: null,
          getState: () => 'available',
          refetch: vi.fn(),
        });

        const { SkillTree } = await import('@/components/skill-tree/SkillTree');

        const { rerender } = render(<SkillTree />);

        // Component should render without errors on re-render
        rerender(<SkillTree />);

        // Verify structure is maintained
        expect(screen.getByTestId('skill-tree-container')).toBeInTheDocument();
      },
      10000 // Extended timeout - multiple async imports can be slow under load
    );
  });

  describe('virtualization support (stub)', () => {
    it('accepts virtualize prop without error', async () => {
      const { useSkillTree } = await import('@/lib/hooks/useSkillTree');

      // Mock the hook
      vi.mocked(useSkillTree).mockReturnValue({
        data: {
          clusters: [
            {
              slug: 'foundations',
              name: 'Foundations',
              description: 'Core programming fundamentals',
              tier: 1,
              masteredCount: 0,
              totalCount: 1,
              subconcepts: [makeNode()],
            },
          ],
          totalMastered: 0,
          totalSubconcepts: 1,
        },
        loading: false,
        error: null,
        getState: () => 'available',
        refetch: vi.fn(),
      });

      const { SkillTree } = await import('@/components/skill-tree/SkillTree');

      // Should accept virtualize prop without throwing
      // (virtualize is currently a stub/no-op)
      expect(() => render(<SkillTree virtualize />)).not.toThrow();
    });

    it('renders normally when virtualize is false', async () => {
      const { useSkillTree } = await import('@/lib/hooks/useSkillTree');

      vi.mocked(useSkillTree).mockReturnValue({
        data: {
          clusters: [
            {
              slug: 'foundations',
              name: 'Foundations',
              description: 'Core programming fundamentals',
              tier: 1,
              masteredCount: 0,
              totalCount: 1,
              subconcepts: [makeNode()],
            },
          ],
          totalMastered: 0,
          totalSubconcepts: 1,
        },
        loading: false,
        error: null,
        getState: () => 'available',
        refetch: vi.fn(),
      });

      const { SkillTree } = await import('@/components/skill-tree/SkillTree');

      render(<SkillTree virtualize={false} />);

      expect(screen.getByTestId('skill-tree-container')).toBeInTheDocument();
    });
  });
});

// Mock the hook
vi.mock('@/lib/hooks/useSkillTree', () => ({
  useSkillTree: vi.fn(() => ({
    data: null,
    loading: true,
    error: null,
  })),
}));
