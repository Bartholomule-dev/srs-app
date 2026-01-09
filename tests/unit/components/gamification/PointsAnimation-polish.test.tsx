// tests/unit/components/gamification/PointsAnimation-polish.test.tsx
// Phase 3.4 Task 1: Micro-interactions for PointsAnimation

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PointsAnimation } from '@/components/gamification/PointsAnimation';

describe('PointsAnimation - Polish & Micro-interactions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('size prop', () => {
    it('applies text-sm for size="small"', () => {
      render(<PointsAnimation points={10} size="small" />);
      const element = screen.getByText('+10');
      expect(element).toHaveClass('text-sm');
    });

    it('applies text-lg for size="medium" (default)', () => {
      render(<PointsAnimation points={10} size="medium" />);
      const element = screen.getByText('+10');
      expect(element).toHaveClass('text-lg');
    });

    it('applies text-lg for default size (no size prop)', () => {
      render(<PointsAnimation points={10} />);
      const element = screen.getByText('+10');
      expect(element).toHaveClass('text-lg');
    });

    it('applies text-2xl for size="large"', () => {
      render(<PointsAnimation points={10} size="large" />);
      const element = screen.getByText('+10');
      expect(element).toHaveClass('text-2xl');
    });
  });

  describe('showSparkle prop', () => {
    it('does not render sparkle by default', () => {
      render(<PointsAnimation points={10} />);
      expect(screen.queryByTestId('sparkle-icon')).not.toBeInTheDocument();
    });

    it('renders sparkle icon when showSparkle is true', () => {
      render(<PointsAnimation points={10} showSparkle />);
      expect(screen.getByTestId('sparkle-icon')).toBeInTheDocument();
    });

    it('sparkle icon is an SVG element', () => {
      render(<PointsAnimation points={10} showSparkle />);
      const sparkle = screen.getByTestId('sparkle-icon');
      expect(sparkle.tagName.toLowerCase()).toBe('svg');
    });

    it('does not render sparkle when showSparkle is false', () => {
      render(<PointsAnimation points={10} showSparkle={false} />);
      expect(screen.queryByTestId('sparkle-icon')).not.toBeInTheDocument();
    });
  });

  describe('animation properties', () => {
    it('renders the points text within animation container', () => {
      render(<PointsAnimation points={10} />);
      // Component renders with animation - the text should be visible
      expect(screen.getByText('+10')).toBeInTheDocument();
    });

    it('renders with animation container', () => {
      const { container } = render(<PointsAnimation points={10} />);
      // The animation container should exist and contain content
      expect(container.firstChild).toBeInTheDocument();
      expect(container.textContent).toContain('+10');
    });
  });

  describe('combined features', () => {
    it('applies large size with sparkle', () => {
      render(<PointsAnimation points={100} size="large" showSparkle />);
      const pointsText = screen.getByText('+100');
      expect(pointsText).toHaveClass('text-2xl');
      expect(screen.getByTestId('sparkle-icon')).toBeInTheDocument();
    });

    it('applies small size with custom className', () => {
      render(<PointsAnimation points={5} size="small" className="test-class" />);
      const element = screen.getByText('+5');
      expect(element).toHaveClass('text-sm');
      expect(element).toHaveClass('test-class');
    });

    it('sparkle works with neutral variant', () => {
      render(<PointsAnimation points={10} variant="neutral" showSparkle />);
      const pointsText = screen.getByText('+10');
      expect(pointsText).toHaveClass('text-text-secondary');
      expect(screen.getByTestId('sparkle-icon')).toBeInTheDocument();
    });
  });
});
