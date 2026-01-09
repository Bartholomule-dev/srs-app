import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BeatHeader } from '@/components/exercise/BeatHeader';

describe('BeatHeader', () => {
  it('renders skin icon and title', () => {
    render(
      <BeatHeader
        skinIcon="✅"
        blueprintTitle="Task Manager"
        beat={3}
        totalBeats={8}
        beatTitle="Prevent duplicates"
      />
    );

    expect(screen.getByText('✅')).toBeInTheDocument();
    expect(screen.getByText('Task Manager')).toBeInTheDocument();
  });

  it('shows beat progress', () => {
    render(
      <BeatHeader
        skinIcon="🎵"
        blueprintTitle="Playlist App"
        beat={5}
        totalBeats={10}
        beatTitle="Display items"
      />
    );

    expect(screen.getByText(/Beat 5 of 10/)).toBeInTheDocument();
  });

  it('shows beat title', () => {
    render(
      <BeatHeader
        skinIcon="📖"
        blueprintTitle="Recipe Book"
        beat={1}
        totalBeats={8}
        beatTitle="Create storage"
      />
    );

    expect(screen.getByText(/"Create storage"/)).toBeInTheDocument();
  });

  it('renders nothing when no beat info provided', () => {
    const { container } = render(
      <BeatHeader
        skinIcon={null}
        blueprintTitle={null}
        beat={null}
        totalBeats={null}
        beatTitle={null}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders with only beat info (no icon)', () => {
    render(
      <BeatHeader
        skinIcon={null}
        blueprintTitle="Test Blueprint"
        beat={1}
        totalBeats={5}
        beatTitle="First step"
      />
    );

    expect(screen.getByText('Test Blueprint')).toBeInTheDocument();
    expect(screen.getByText(/Beat 1 of 5/)).toBeInTheDocument();
  });

  it('renders without beat title when not provided', () => {
    render(
      <BeatHeader
        skinIcon="🔧"
        blueprintTitle="Tool Builder"
        beat={2}
        totalBeats={6}
        beatTitle={null}
      />
    );

    expect(screen.getByText('Tool Builder')).toBeInTheDocument();
    expect(screen.getByText(/Beat 2 of 6/)).toBeInTheDocument();
    // Should not have any quoted text
    expect(screen.queryByText(/"/)).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <BeatHeader
        skinIcon="📦"
        blueprintTitle="Inventory System"
        beat={1}
        totalBeats={4}
        beatTitle="Setup"
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
