// tests/unit/components/ui/Card.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Card className="custom-class">Content</Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('custom-class');
  });

  describe('elevation variants', () => {
    it('applies default elevation 1 styles', () => {
      render(<Card>Content</Card>);
      const card = screen.getByText('Content').closest('div');
      expect(card).toHaveClass('bg-[var(--bg-surface-1)]');
      expect(card).toHaveClass('shadow-[0_2px_12px_rgba(0,0,0,0.3)]');
    });

    it('applies flat elevation styles', () => {
      render(<Card elevation="flat">Content</Card>);
      const card = screen.getByText('Content').closest('div');
      expect(card).toHaveClass('bg-transparent');
      expect(card).toHaveClass('shadow-none');
    });

    it('applies elevation 1 styles', () => {
      render(<Card elevation={1}>Content</Card>);
      const card = screen.getByText('Content').closest('div');
      expect(card).toHaveClass('bg-[var(--bg-surface-1)]');
      expect(card).toHaveClass('shadow-[0_2px_12px_rgba(0,0,0,0.3)]');
    });

    it('applies elevation 2 styles', () => {
      render(<Card elevation={2}>Content</Card>);
      const card = screen.getByText('Content').closest('div');
      expect(card).toHaveClass('bg-[var(--bg-surface-2)]');
      expect(card).toHaveClass('shadow-[0_4px_24px_rgba(0,0,0,0.4)]');
    });

    it('applies elevation 3 styles', () => {
      render(<Card elevation={3}>Content</Card>);
      const card = screen.getByText('Content').closest('div');
      expect(card).toHaveClass('bg-[var(--bg-surface-3)]');
      expect(card).toHaveClass('shadow-[0_8px_32px_rgba(0,0,0,0.5)]');
    });
  });

  describe('interactive mode', () => {
    it('does not apply interactive classes by default', () => {
      render(<Card>Content</Card>);
      const card = screen.getByText('Content').closest('div');
      expect(card).not.toHaveClass('cursor-pointer');
      expect(card).not.toHaveClass('hover:-translate-y-0.5');
    });

    it('applies interactive hover classes when interactive is true', () => {
      render(<Card interactive>Content</Card>);
      const card = screen.getByText('Content').closest('div');
      expect(card).toHaveClass('cursor-pointer');
      expect(card).toHaveClass('hover:-translate-y-0.5');
      expect(card).toHaveClass('hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]');
      expect(card).toHaveClass('hover:border-[rgba(59,130,246,0.3)]');
    });

    it('combines elevation and interactive styles', () => {
      render(<Card elevation={2} interactive>Content</Card>);
      const card = screen.getByText('Content').closest('div');
      // Elevation styles
      expect(card).toHaveClass('bg-[var(--bg-surface-2)]');
      expect(card).toHaveClass('shadow-[0_4px_24px_rgba(0,0,0,0.4)]');
      // Interactive styles
      expect(card).toHaveClass('cursor-pointer');
      expect(card).toHaveClass('hover:-translate-y-0.5');
    });
  });

  it('applies transition classes for smooth animations', () => {
    render(<Card>Content</Card>);
    const card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('transition-all');
    expect(card).toHaveClass('duration-200');
  });
});

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<CardHeader className="header-class">Header</CardHeader>);
    const header = screen.getByText('Header').closest('div');
    expect(header).toHaveClass('header-class');
  });
});

describe('CardContent', () => {
  it('renders children', () => {
    render(<CardContent>Main content</CardContent>);
    expect(screen.getByText('Main content')).toBeInTheDocument();
  });
});

describe('CardFooter', () => {
  it('renders children', () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });
});

describe('CardTitle', () => {
  it('renders children', () => {
    render(<CardTitle>Title text</CardTitle>);
    expect(screen.getByText('Title text')).toBeInTheDocument();
  });
});

describe('CardDescription', () => {
  it('renders children', () => {
    render(<CardDescription>Description text</CardDescription>);
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });
});

describe('Card composition', () => {
  it('renders full card with all sub-components', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description</CardDescription>
        </CardHeader>
        <CardContent>Main content here</CardContent>
        <CardFooter>Footer actions</CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card description')).toBeInTheDocument();
    expect(screen.getByText('Main content here')).toBeInTheDocument();
    expect(screen.getByText('Footer actions')).toBeInTheDocument();
  });
});
