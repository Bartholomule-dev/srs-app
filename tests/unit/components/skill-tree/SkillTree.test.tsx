// tests/unit/components/skill-tree/SkillTree.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkillTree } from '@/components/skill-tree/SkillTree';
import { AuthProvider } from '@/lib/context/AuthContext';
import type { ReactNode } from 'react';

// Mock useSkillTree hook
vi.mock('@/lib/hooks/useSkillTree', () => ({
  useSkillTree: vi.fn(),
}));

import { useSkillTree } from '@/lib/hooks/useSkillTree';

// Mock Supabase for AuthProvider
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithOtp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('SkillTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    vi.mocked(useSkillTree).mockReturnValue({
      data: null,
      loading: true,
      error: null,
      getState: () => 'locked',
      refetch: vi.fn(),
    });

    render(<SkillTree />, { wrapper });

    expect(screen.getByTestId('skill-tree-loading')).toBeInTheDocument();
  });

  it('renders error state', () => {
    vi.mocked(useSkillTree).mockReturnValue({
      data: null,
      loading: false,
      error: 'Failed to load',
      getState: () => 'locked',
      refetch: vi.fn(),
    });

    render(<SkillTree />, { wrapper });

    expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
  });

  it('renders skill tree when data loaded', () => {
    vi.mocked(useSkillTree).mockReturnValue({
      data: {
        clusters: [
          {
            slug: 'foundations',
            name: 'Foundations',
            description: 'Basic concepts',
            tier: 1,
            subconcepts: [
              { slug: 'variables', name: 'Variables', concept: 'foundations', state: 'available', stability: null, reps: 0, prereqs: [] },
            ],
            masteredCount: 0,
            totalCount: 1,
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

    render(<SkillTree />, { wrapper });

    expect(screen.getByText('Foundations')).toBeInTheDocument();
    expect(screen.getByText('0/1')).toBeInTheDocument();
  });

  it('renders all concept clusters', () => {
    vi.mocked(useSkillTree).mockReturnValue({
      data: {
        clusters: [
          { slug: 'foundations', name: 'Foundations', description: '', tier: 1, subconcepts: [], masteredCount: 0, totalCount: 4 },
          { slug: 'strings', name: 'Strings', description: '', tier: 2, subconcepts: [], masteredCount: 0, totalCount: 5 },
        ],
        totalMastered: 0,
        totalSubconcepts: 9,
      },
      loading: false,
      error: null,
      getState: () => 'available',
      refetch: vi.fn(),
    });

    render(<SkillTree />, { wrapper });

    expect(screen.getByText('Foundations')).toBeInTheDocument();
    expect(screen.getByText('Strings')).toBeInTheDocument();
  });

  it('uses dark background', () => {
    vi.mocked(useSkillTree).mockReturnValue({
      data: {
        clusters: [],
        totalMastered: 0,
        totalSubconcepts: 0,
      },
      loading: false,
      error: null,
      getState: () => 'available',
      refetch: vi.fn(),
    });

    const { container } = render(<SkillTree />, { wrapper });

    const treeContainer = container.querySelector('[data-testid="skill-tree-container"]');
    expect(treeContainer).toHaveClass('bg-[var(--bg-surface-1)]');
  });

  it('uses vertical layout without horizontal scroll', () => {
    vi.mocked(useSkillTree).mockReturnValue({
      data: {
        clusters: [],
        totalMastered: 0,
        totalSubconcepts: 0,
      },
      loading: false,
      error: null,
      getState: () => 'available',
      refetch: vi.fn(),
    });

    const { container } = render(<SkillTree />, { wrapper });

    // Should NOT have horizontal scroll
    const scrollContainer = container.querySelector('[data-testid="skill-tree-scroll"]');
    expect(scrollContainer).not.toHaveClass('overflow-x-auto');

    // Should have vertical flex layout
    const treeContainer = container.querySelector('[data-testid="skill-tree-container"]');
    expect(treeContainer).toBeInTheDocument();
  });

  it('renders tiers vertically with horizontal clusters', () => {
    vi.mocked(useSkillTree).mockReturnValue({
      data: {
        clusters: [
          { slug: 'foundations', name: 'Foundations', description: '', tier: 1, subconcepts: [], masteredCount: 0, totalCount: 4 },
          { slug: 'strings', name: 'Strings', description: '', tier: 2, subconcepts: [], masteredCount: 0, totalCount: 5 },
          { slug: 'numbers', name: 'Numbers', description: '', tier: 2, subconcepts: [], masteredCount: 0, totalCount: 6 },
        ],
        totalMastered: 0,
        totalSubconcepts: 15,
      },
      loading: false,
      error: null,
      getState: () => 'available',
      refetch: vi.fn(),
    });

    render(<SkillTree />, { wrapper });

    // All three concept names should be visible
    expect(screen.getByText('Foundations')).toBeInTheDocument();
    expect(screen.getByText('Strings')).toBeInTheDocument();
    expect(screen.getByText('Numbers')).toBeInTheDocument();
  });
});
