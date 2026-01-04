// tests/unit/components/ui/Button.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(<Button onClick={() => { clicked = true; }}>Click</Button>);

    await user.click(screen.getByRole('button'));
    expect(clicked).toBe(true);
  });

  it('supports disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('supports different variants', () => {
    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('supports loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  describe('animations and effects', () => {
    it('applies transition classes by default', () => {
      render(<Button>Animated</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('transition-all');
    });

    it('applies glow effect when glow prop is true on primary variant', () => {
      render(<Button variant="primary" glow>Glowing</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('shadow-');
    });

    it('does not apply glow effect on non-primary variants', () => {
      render(<Button variant="secondary" glow>No Glow</Button>);
      const button = screen.getByRole('button');
      // The shadow class should not be present for non-primary variants
      expect(button.className).not.toContain('shadow-[0_0_20px');
    });

    it('merges custom className with default classes', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
      expect(button.className).toContain('transition-all');
    });
  });
});
