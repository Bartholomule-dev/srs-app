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

    it('applies transition-shadow when glow prop is true', () => {
      render(<Button variant="primary" glow>Glowing</Button>);
      const button = screen.getByRole('button');
      // Glow prop now applies transition class for external animation via motion wrapper
      expect(button.className).toContain('transition-shadow');
    });

    it('applies transition-shadow on any variant when glow is true', () => {
      render(<Button variant="secondary" glow>With Transition</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('transition-shadow');
    });

    it('merges custom className with default classes', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
      expect(button.className).toContain('transition-all');
    });
  });
});
