import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/Tooltip';

// Test constants
const LONG_PRESS_DELAY = 500;

function renderTooltip() {
  return render(
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger data-testid="trigger">Hover me</TooltipTrigger>
        <TooltipContent>Tooltip content</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

describe('Tooltip touch support', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('long press to show', () => {
    it('shows tooltip after 500ms touchStart', async () => {
      renderTooltip();
      const trigger = screen.getByTestId('trigger');

      // Tooltip should not be visible initially
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      // Start long press
      fireEvent.touchStart(trigger);

      // Should not show immediately
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      // Advance to just before threshold
      act(() => {
        vi.advanceTimersByTime(LONG_PRESS_DELAY - 1);
      });
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      // Advance past threshold
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('cancels tooltip if touchEnd before 500ms', async () => {
      renderTooltip();
      const trigger = screen.getByTestId('trigger');

      // Start long press
      fireEvent.touchStart(trigger);

      // Advance partway
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Release before threshold
      fireEvent.touchEnd(trigger);

      // Advance past original threshold
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should not show tooltip
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('cancels tooltip if touchMove occurs (scroll detection)', async () => {
      renderTooltip();
      const trigger = screen.getByTestId('trigger');

      // Start long press
      fireEvent.touchStart(trigger);

      // Advance partway
      act(() => {
        vi.advanceTimersByTime(200);
      });

      // User starts scrolling
      fireEvent.touchMove(trigger);

      // Advance past original threshold
      act(() => {
        vi.advanceTimersByTime(400);
      });

      // Should not show tooltip
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('dismiss on tap outside', () => {
    it('dismisses tooltip when tapping outside trigger', async () => {
      const { container } = renderTooltip();
      const trigger = screen.getByTestId('trigger');

      // Long press to show tooltip
      fireEvent.touchStart(trigger);
      act(() => {
        vi.advanceTimersByTime(LONG_PRESS_DELAY);
      });
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      // End the touch
      fireEvent.touchEnd(trigger);

      // Tap outside (on body/container)
      fireEvent.touchStart(container);

      // Tooltip should be dismissed
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('does not dismiss when tapping on trigger', async () => {
      renderTooltip();
      const trigger = screen.getByTestId('trigger');

      // Long press to show tooltip
      fireEvent.touchStart(trigger);
      act(() => {
        vi.advanceTimersByTime(LONG_PRESS_DELAY);
      });
      fireEvent.touchEnd(trigger);

      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      // Tap on trigger again (start new touch)
      fireEvent.touchStart(trigger);

      // Tooltip should still be visible (not dismissed by trigger tap)
      // It will start a new long press timer, but shouldn't dismiss
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });
  });

  describe('hover behavior preserved', () => {
    it('still shows tooltip on mouse hover for desktop', async () => {
      render(
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger data-testid="trigger">Hover me</TooltipTrigger>
            <TooltipContent>Tooltip content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
      const trigger = screen.getByTestId('trigger');

      // Mouse hover
      fireEvent.mouseEnter(trigger);

      // Advance past hover delay
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    it('dismisses tooltip on mouse leave for desktop', async () => {
      render(
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger data-testid="trigger">Hover me</TooltipTrigger>
            <TooltipContent>Tooltip content</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
      const trigger = screen.getByTestId('trigger');

      // Show via hover
      fireEvent.mouseEnter(trigger);
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      // Leave
      fireEvent.mouseLeave(trigger);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('skips hover when touch was detected', async () => {
      renderTooltip();
      const trigger = screen.getByTestId('trigger');

      // First touch the trigger (marks as touch device)
      fireEvent.touchStart(trigger);
      fireEvent.touchEnd(trigger);

      // Now try to hover
      fireEvent.mouseEnter(trigger);
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Should not show via hover after touch
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });
});
