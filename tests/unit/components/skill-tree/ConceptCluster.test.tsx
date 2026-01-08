// tests/unit/components/skill-tree/ConceptCluster.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConceptCluster } from '@/components/skill-tree/ConceptCluster';
import type { SkillTreeCluster } from '@/lib/skill-tree/types';

const makeCluster = (overrides: Partial<SkillTreeCluster> = {}): SkillTreeCluster => ({
  slug: 'foundations',
  name: 'Foundations',
  description: 'Variables, operators, expressions',
  tier: 1,
  subconcepts: [
    { slug: 'variables', name: 'Variables', concept: 'foundations', state: 'mastered', stability: 10, reps: 3, prereqs: [] },
    { slug: 'operators', name: 'Operators', concept: 'foundations', state: 'available', stability: null, reps: 0, prereqs: ['variables'] },
  ],
  masteredCount: 1,
  totalCount: 2,
  ...overrides,
});

describe('ConceptCluster', () => {
  it('renders concept name as label', () => {
    render(<ConceptCluster cluster={makeCluster()} />);

    expect(screen.getByText('Foundations')).toBeInTheDocument();
  });

  it('renders progress badge with mastered/total', () => {
    render(<ConceptCluster cluster={makeCluster({ masteredCount: 3, totalCount: 5 })} />);

    expect(screen.getByText('3/5')).toBeInTheDocument();
  });

  it('renders all subconcept nodes', () => {
    render(<ConceptCluster cluster={makeCluster()} />);

    // Should render 2 nodes (from makeCluster)
    const nodes = screen.getAllByRole('button');
    expect(nodes).toHaveLength(2);
  });

  it('uses Space Grotesk font for label', () => {
    render(<ConceptCluster cluster={makeCluster()} />);

    const label = screen.getByText('Foundations');
    expect(label).toHaveClass('font-display');
  });

  it('applies custom className', () => {
    const { container } = render(
      <ConceptCluster cluster={makeCluster()} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
