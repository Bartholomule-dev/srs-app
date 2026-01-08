import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DependencyLines } from '@/components/skill-tree/DependencyLines';
import type { SkillTreeCluster } from '@/lib/skill-tree/types';

const makeClusters = (): SkillTreeCluster[] => [
  {
    slug: 'foundations',
    name: 'Foundations',
    description: 'Basic concepts',
    tier: 1,
    subconcepts: [
      { slug: 'variables', name: 'Variables', concept: 'foundations', state: 'mastered', stability: 10, prereqs: [] },
      { slug: 'operators', name: 'Operators', concept: 'foundations', state: 'available', stability: null, prereqs: ['variables'] },
    ],
    masteredCount: 1,
    totalCount: 2,
  },
];

describe('DependencyLines', () => {
  it('renders SVG overlay', () => {
    const { container } = render(
      <DependencyLines clusters={makeClusters()} nodePositions={{}} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('has pointer-events-none for click passthrough', () => {
    const { container } = render(
      <DependencyLines clusters={makeClusters()} nodePositions={{}} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('pointer-events-none');
  });

  it('renders path elements for dependencies', () => {
    const nodePositions = {
      variables: { x: 50, y: 50 },
      operators: { x: 50, y: 120 },
    };

    const { container } = render(
      <DependencyLines clusters={makeClusters()} nodePositions={nodePositions} />
    );

    // operators depends on variables, so there should be a path
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThan(0);
  });

  it('does not render paths when positions are missing', () => {
    const { container } = render(
      <DependencyLines clusters={makeClusters()} nodePositions={{}} />
    );

    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(0);
  });

  it('uses gradient for unlocked paths', () => {
    const nodePositions = {
      variables: { x: 50, y: 50 },
      operators: { x: 50, y: 120 },
    };

    const { container } = render(
      <DependencyLines clusters={makeClusters()} nodePositions={nodePositions} />
    );

    const path = container.querySelector('path');
    // Path should reference a gradient URL (using dynamic useId())
    const stroke = path?.getAttribute('stroke');
    expect(stroke).toMatch(/^url\(#.+\)$/);
  });

  it('defines gradient in SVG defs', () => {
    const { container } = render(
      <DependencyLines clusters={makeClusters()} nodePositions={{}} />
    );

    const gradient = container.querySelector('linearGradient');
    expect(gradient).toBeInTheDocument();
    expect(gradient?.tagName.toLowerCase()).toBe('lineargradient');
  });
});
