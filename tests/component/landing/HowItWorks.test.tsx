// tests/component/landing/HowItWorks.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HowItWorks } from '@/components/landing/HowItWorks';

// Mock useAuth to prevent Supabase client initialization when importing from barrel file
vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: vi.fn(),
    loading: false,
    user: null,
  }),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => <div className={className}>{children}</div>,
  },
  useInView: () => true,
}));

describe('HowItWorks', () => {
  it('renders section heading', () => {
    render(<HowItWorks />);
    expect(screen.getByText('How It Works')).toBeInTheDocument();
  });

  it('renders section subheading', () => {
    render(<HowItWorks />);
    expect(
      screen.getByText('Three simple steps to keep your syntax sharp')
    ).toBeInTheDocument();
  });

  it('renders all 3 step titles', () => {
    render(<HowItWorks />);
    expect(screen.getByText('Get Daily Exercises')).toBeInTheDocument();
    expect(screen.getByText('Type From Memory')).toBeInTheDocument();
    expect(screen.getByText('Algorithm Adapts')).toBeInTheDocument();
  });

  it('renders all 3 step descriptions', () => {
    render(<HowItWorks />);
    expect(
      screen.getByText(
        'Personalized practice based on your schedule and progress.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Write actual code syntax without peeking at references.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('Smart scheduling adjusts based on your accuracy.')
    ).toBeInTheDocument();
  });

  it('displays all three step number badges', () => {
    render(<HowItWorks />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
