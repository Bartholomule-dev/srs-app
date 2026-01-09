import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BlueprintProgress } from '@/components/session/BlueprintProgress';

describe('BlueprintProgress', () => {
  it('shows blueprint title and progress', () => {
    render(
      <BlueprintProgress blueprintTitle="CLI App" currentBeat={3} totalBeats={8} />
    );

    expect(screen.getByText('CLI App')).toBeInTheDocument();
    expect(screen.getByText('Beat 3 of 8')).toBeInTheDocument();
  });

  it('shows skin icon when provided', () => {
    render(
      <BlueprintProgress
        blueprintTitle="CLI App"
        currentBeat={3}
        totalBeats={8}
        skinIcon="📋"
      />
    );

    expect(screen.getByText('📋')).toBeInTheDocument();
  });

  it('calculates progress percentage correctly', () => {
    const { container } = render(
      <BlueprintProgress blueprintTitle="CLI App" currentBeat={4} totalBeats={8} />
    );

    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle('width: 50%');
  });

  it('shows 0% progress at beat 0', () => {
    const { container } = render(
      <BlueprintProgress blueprintTitle="CLI App" currentBeat={0} totalBeats={8} />
    );

    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle('width: 0%');
  });

  it('shows 100% progress at final beat', () => {
    const { container } = render(
      <BlueprintProgress blueprintTitle="CLI App" currentBeat={8} totalBeats={8} />
    );

    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle('width: 100%');
  });

  it('handles edge case of 0 total beats gracefully', () => {
    const { container } = render(
      <BlueprintProgress blueprintTitle="Empty" currentBeat={0} totalBeats={0} />
    );

    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle('width: 0%');
    expect(screen.getByText('Beat 0 of 0')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <BlueprintProgress
        blueprintTitle="CLI App"
        currentBeat={1}
        totalBeats={8}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has accessible progressbar role with correct aria attributes', () => {
    render(
      <BlueprintProgress blueprintTitle="CLI App" currentBeat={3} totalBeats={8} />
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '38'); // 3/8 = 37.5%, rounded to 38
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute(
      'aria-label',
      'Blueprint progress: 3 of 8 beats'
    );
  });

  it('rounds progress percentage to nearest integer', () => {
    render(
      <BlueprintProgress blueprintTitle="Test" currentBeat={1} totalBeats={3} />
    );

    // 1/3 = 33.33...%, should round to 33%
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '33');
  });

  it('renders without skin icon', () => {
    render(
      <BlueprintProgress blueprintTitle="No Icon" currentBeat={2} totalBeats={5} />
    );

    expect(screen.getByText('No Icon')).toBeInTheDocument();
    expect(screen.getByText('Beat 2 of 5')).toBeInTheDocument();
  });
});
