# UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform SyntaxSRS from basic UI to "IDE-Inspired Premium" aesthetic with dark mode default, distinctive typography, bento layouts, and polished animations.

**Architecture:** Layer-by-layer approach - foundation (theme/fonts) first, then core UI components, then page-specific components, then animations. Each phase is independently testable and deployable.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, darwin-ui, framer-motion, Vitest

**Design Doc:** `docs/plans/2026-01-04-ui-redesign-design.md`

---

## Phase 1: Foundation (Theme System & Fonts)

### Task 1.1: Install Font Packages

**Files:**
- Modify: `package.json`

**Step 1: Install fonts**

```bash
pnpm add @fontsource-variable/space-grotesk @fontsource-variable/dm-sans @fontsource-variable/jetbrains-mono
```

**Step 2: Verify installation**

```bash
pnpm list @fontsource-variable/space-grotesk
```
Expected: Package listed in dependencies

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add Space Grotesk, DM Sans, JetBrains Mono fonts"
```

---

### Task 1.2: Update Root Layout with New Fonts

**Files:**
- Modify: `src/app/layout.tsx`
- Test: `tests/unit/app/layout.test.tsx`

**Step 1: Update the failing test to expect new fonts**

```tsx
// tests/unit/app/layout.test.tsx
import { describe, it, expect, vi } from 'vitest';

// Mock the font imports
vi.mock('@fontsource-variable/space-grotesk', () => ({}));
vi.mock('@fontsource-variable/dm-sans', () => ({}));
vi.mock('@fontsource-variable/jetbrains-mono', () => ({}));

describe('RootLayout', () => {
  it('exports metadata with correct title', async () => {
    const { metadata } = await import('@/app/layout');
    expect(metadata.title).toBe('SyntaxSRS');
  });

  it('exports metadata with correct description', async () => {
    const { metadata } = await import('@/app/layout');
    expect(metadata.description).toContain('spaced repetition');
  });
});
```

**Step 2: Run test to verify setup**

```bash
pnpm test tests/unit/app/layout.test.tsx
```

**Step 3: Update layout.tsx with new fonts**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Providers } from "@/components/Providers";

// Import variable fonts
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/jetbrains-mono';

import "./globals.css";

export const metadata: Metadata = {
  title: "SyntaxSRS",
  description: "Practice code syntax through spaced repetition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-background text-foreground">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

**Step 4: Run tests**

```bash
pnpm test tests/unit/app/layout.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/layout.tsx tests/unit/app/layout.test.tsx
git commit -m "feat: update layout with new font imports and dark mode default"
```

---

### Task 1.3: Create Theme CSS Variables

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Replace globals.css with new theme system**

```css
/* src/app/globals.css */
@import "tailwindcss";
@import '@pikoloo/darwin-ui/styles';

/* ===== COLOR SYSTEM ===== */

:root {
  /* Light mode colors */
  --background: #f8f9fc;
  --background-surface-1: #ffffff;
  --background-surface-2: #f0f1f5;
  --background-surface-3: #e8e9ed;

  --foreground: #0f0f14;
  --foreground-secondary: #5c5c6b;
  --foreground-tertiary: #8b8b99;

  --border: #e2e4eb;
  --border-subtle: #eceef2;

  --accent-primary: #3b82f6;
  --accent-success: #22c55e;
  --accent-warning: #f59e0b;
  --accent-error: #ef4444;

  /* Syntax highlighting */
  --syntax-keyword: #8b5cf6;
  --syntax-string: #22c55e;
  --syntax-function: #3b82f6;
  --syntax-number: #f59e0b;
  --syntax-comment: #9ca3af;
}

.dark {
  /* Dark mode colors */
  --background: #0a0a0f;
  --background-surface-1: #12121a;
  --background-surface-2: #1a1a24;
  --background-surface-3: #24242e;

  --foreground: #f0f0f5;
  --foreground-secondary: #8b8b99;
  --foreground-tertiary: #5c5c6b;

  --border: #2a2a35;
  --border-subtle: #1f1f28;

  --accent-primary: #3b82f6;
  --accent-success: #22c55e;
  --accent-warning: #f59e0b;
  --accent-error: #ef4444;

  /* Syntax highlighting (dark mode) */
  --syntax-keyword: #c678dd;
  --syntax-string: #98c379;
  --syntax-function: #61afef;
  --syntax-number: #d19a66;
  --syntax-comment: #5c6370;
}

/* ===== TAILWIND THEME ===== */

@theme inline {
  /* Colors */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-surface-1: var(--background-surface-1);
  --color-surface-2: var(--background-surface-2);
  --color-surface-3: var(--background-surface-3);
  --color-muted: var(--foreground-secondary);
  --color-subtle: var(--foreground-tertiary);
  --color-border: var(--border);
  --color-border-subtle: var(--border-subtle);
  --color-accent: var(--accent-primary);
  --color-success: var(--accent-success);
  --color-warning: var(--accent-warning);
  --color-error: var(--accent-error);

  /* Fonts */
  --font-sans: 'DM SansVariable', 'DM Sans', ui-sans-serif, system-ui, sans-serif;
  --font-display: 'Space GroteskVariable', 'Space Grotesk', ui-sans-serif, sans-serif;
  --font-mono: 'JetBrains MonoVariable', 'JetBrains Mono', ui-monospace, monospace;

  /* Animation */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --ease-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ===== BASE STYLES ===== */

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
}

/* Code elements */
code, pre, .font-mono {
  font-family: var(--font-mono);
}

/* Display headings */
h1, h2, .font-display {
  font-family: var(--font-display);
}

/* ===== UTILITY CLASSES ===== */

/* Glow effects */
.glow-success {
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
}

.glow-accent {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
}

.glow-error {
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
}

/* Card elevation */
.card-elevated {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}

/* Glassmorphism */
.glass {
  backdrop-filter: blur(12px);
  background: rgba(18, 18, 26, 0.8);
}

/* Grain texture overlay */
.grain::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
  z-index: 1;
}
```

**Step 2: Verify build succeeds**

```bash
pnpm build
```
Expected: Build completes without CSS errors

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add comprehensive theme system with dark mode colors and utilities"
```

---

### Task 1.4: Verify Theme Foundation with Visual Test

**Files:**
- Create: `src/app/theme-test/page.tsx` (temporary)

**Step 1: Create theme test page**

```tsx
// src/app/theme-test/page.tsx
export default function ThemeTestPage() {
  return (
    <div className="min-h-screen p-8 space-y-8">
      <h1 className="text-4xl font-display font-bold">Theme Test</h1>

      <section className="space-y-4">
        <h2 className="text-2xl font-display">Colors</h2>
        <div className="flex gap-4">
          <div className="w-20 h-20 bg-background border border-border rounded">bg</div>
          <div className="w-20 h-20 bg-surface-1 border border-border rounded">s1</div>
          <div className="w-20 h-20 bg-surface-2 border border-border rounded">s2</div>
          <div className="w-20 h-20 bg-surface-3 border border-border rounded">s3</div>
        </div>
        <div className="flex gap-4">
          <div className="w-20 h-20 bg-accent rounded flex items-center justify-center text-white">accent</div>
          <div className="w-20 h-20 bg-success rounded flex items-center justify-center text-white">success</div>
          <div className="w-20 h-20 bg-warning rounded flex items-center justify-center text-white">warning</div>
          <div className="w-20 h-20 bg-error rounded flex items-center justify-center text-white">error</div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-display">Typography</h2>
        <p className="font-display text-xl">Display: Space Grotesk</p>
        <p className="font-sans">Body: DM Sans - The quick brown fox jumps over the lazy dog.</p>
        <p className="font-mono">Code: JetBrains Mono - const x = 42;</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-display">Text Hierarchy</h2>
        <p className="text-foreground">Primary text</p>
        <p className="text-muted">Secondary/muted text</p>
        <p className="text-subtle">Tertiary/subtle text</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-display">Effects</h2>
        <div className="flex gap-4">
          <div className="w-32 h-20 bg-surface-1 rounded glow-accent flex items-center justify-center">Accent Glow</div>
          <div className="w-32 h-20 bg-surface-1 rounded glow-success flex items-center justify-center">Success Glow</div>
          <div className="w-32 h-20 bg-surface-1 rounded card-elevated flex items-center justify-center">Elevated</div>
        </div>
      </section>
    </div>
  );
}
```

**Step 2: Run dev server and verify visually**

```bash
pnpm dev
# Visit http://localhost:3000/theme-test
```
Expected:
- Dark background (#0a0a0f)
- All color swatches visible
- Three distinct fonts visible
- Glow effects visible on hover cards

**Step 3: Remove test page (don't commit)**

```bash
rm -rf src/app/theme-test
```

**Step 4: Run all tests to ensure nothing broke**

```bash
pnpm test:run
```
Expected: All 429 tests pass

---

## Phase 2: Core UI Components

### Task 2.1: Update Button Component with New Variants

**Files:**
- Modify: `src/components/ui/Button.tsx`
- Modify: `tests/unit/components/ui/Button.test.tsx`

**Step 1: Update Button test for new styling**

```tsx
// tests/unit/components/ui/Button.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies primary variant by default', () => {
    render(<Button>Primary</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('applies ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button', { name: /ghost/i })).toBeInTheDocument();
  });

  it('applies danger variant', () => {
    render(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button', { name: /danger/i })).toBeInTheDocument();
  });

  it('supports disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('supports size prop', () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button', { name: /large/i })).toBeInTheDocument();
  });
});
```

**Step 2: Run test**

```bash
pnpm test tests/unit/components/ui/Button.test.tsx
```

**Step 3: Update Button component**

```tsx
// src/components/ui/Button.tsx
'use client';

import { Button as DarwinButton } from '@pikoloo/darwin-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ComponentProps<typeof DarwinButton>, 'variant' | 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  glow?: boolean;
}

const variantMap: Record<ButtonVariant, ComponentProps<typeof DarwinButton>['variant']> = {
  primary: 'primary',
  secondary: 'secondary',
  ghost: 'ghost',
  danger: 'destructive',
};

const sizeMap: Record<ButtonSize, ComponentProps<typeof DarwinButton>['size']> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  glow = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <DarwinButton
      variant={variantMap[variant]}
      size={sizeMap[size]}
      className={cn(
        'transition-all duration-[--duration-fast] ease-[--ease-out]',
        'hover:scale-[1.02] active:scale-[0.98]',
        glow && variant === 'primary' && 'hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]',
        glow && variant === 'danger' && 'hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]',
        className
      )}
      {...props}
    >
      {children}
    </DarwinButton>
  );
}
```

**Step 4: Create cn utility if it doesn't exist**

```bash
# Check if it exists
cat src/lib/utils.ts 2>/dev/null || echo "Need to create"
```

If needed, create:

```tsx
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

And install dependencies:

```bash
pnpm add clsx tailwind-merge
```

**Step 5: Run tests**

```bash
pnpm test tests/unit/components/ui/Button.test.tsx
```
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/ui/Button.tsx tests/unit/components/ui/Button.test.tsx src/lib/utils.ts package.json pnpm-lock.yaml
git commit -m "feat(ui): enhance Button with size prop, glow effect, and micro-interactions"
```

---

### Task 2.2: Create Code Editor Input Component

**Files:**
- Create: `src/components/ui/CodeEditor.tsx`
- Create: `tests/unit/components/ui/CodeEditor.test.tsx`

**Step 1: Write the failing test**

```tsx
// tests/unit/components/ui/CodeEditor.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeEditor } from '@/components/ui/CodeEditor';

describe('CodeEditor', () => {
  it('renders with placeholder', () => {
    render(<CodeEditor value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText(/type your code/i)).toBeInTheDocument();
  });

  it('displays value', () => {
    render(<CodeEditor value="print('hello')" onChange={() => {}} />);
    expect(screen.getByDisplayValue("print('hello')")).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const handleChange = vi.fn();
    render(<CodeEditor value="" onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'x');

    expect(handleChange).toHaveBeenCalled();
  });

  it('calls onSubmit on Cmd/Ctrl+Enter', async () => {
    const handleSubmit = vi.fn();
    render(<CodeEditor value="test" onChange={() => {}} onSubmit={handleSubmit} />);

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter', metaKey: true });

    expect(handleSubmit).toHaveBeenCalled();
  });

  it('shows line numbers when enabled', () => {
    render(<CodeEditor value="line1\nline2" onChange={() => {}} showLineNumbers />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('applies disabled state', () => {
    render(<CodeEditor value="" onChange={() => {}} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('applies success state styling', () => {
    const { container } = render(<CodeEditor value="" onChange={() => {}} state="success" />);
    expect(container.querySelector('.border-success')).toBeInTheDocument();
  });

  it('applies error state styling', () => {
    const { container } = render(<CodeEditor value="" onChange={() => {}} state="error" />);
    expect(container.querySelector('.border-error')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
pnpm test tests/unit/components/ui/CodeEditor.test.tsx
```
Expected: FAIL - module not found

**Step 3: Implement CodeEditor component**

```tsx
// src/components/ui/CodeEditor.tsx
'use client';

import { useRef, useEffect, type KeyboardEvent, type ChangeEvent } from 'react';
import { cn } from '@/lib/utils';

export type CodeEditorState = 'default' | 'success' | 'error';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  placeholder?: string;
  showLineNumbers?: boolean;
  state?: CodeEditorState;
  className?: string;
  'aria-label'?: string;
}

export function CodeEditor({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = '# Type your code here...',
  showLineNumbers = false,
  state = 'default',
  className,
  'aria-label': ariaLabel = 'Code editor',
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus();
    }
  }, [disabled]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd/Ctrl + Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && onSubmit && !disabled) {
      e.preventDefault();
      onSubmit();
    }

    // Handle Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      // Set cursor position after indent
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const lines = value.split('\n');
  const lineCount = Math.max(lines.length, 3);

  const stateStyles = {
    default: 'border-border focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20',
    success: 'border-success ring-2 ring-success/20 glow-success',
    error: 'border-error ring-2 ring-error/20 glow-error',
  };

  return (
    <div
      className={cn(
        'relative flex rounded-lg border bg-surface-2 transition-all duration-[--duration-normal]',
        stateStyles[state],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {showLineNumbers && (
        <div
          className="flex flex-col items-end py-4 px-3 border-r border-border-subtle select-none"
          aria-hidden="true"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <span
              key={i + 1}
              className="font-mono text-sm leading-6 text-subtle"
            >
              {i + 1}
            </span>
          ))}
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        className={cn(
          'flex-1 bg-transparent font-mono text-[15px] leading-6',
          'p-4 resize-none outline-none',
          'placeholder:text-subtle',
          'min-h-[120px]'
        )}
        rows={lineCount}
      />
    </div>
  );
}
```

**Step 4: Export from ui/index.ts**

```bash
echo "export { CodeEditor } from './CodeEditor';" >> src/components/ui/index.ts
```

**Step 5: Run tests**

```bash
pnpm test tests/unit/components/ui/CodeEditor.test.tsx
```
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/ui/CodeEditor.tsx tests/unit/components/ui/CodeEditor.test.tsx src/components/ui/index.ts
git commit -m "feat(ui): add CodeEditor component with line numbers and state styling"
```

---

### Task 2.3: Update Card Component with Elevation Variants

**Files:**
- Modify: `src/components/ui/Card.tsx`
- Modify: `tests/unit/components/ui/Card.test.tsx`

**Step 1: Update Card test**

```tsx
// tests/unit/components/ui/Card.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies elevated variant', () => {
    const { container } = render(<Card variant="elevated">Content</Card>);
    expect(container.firstChild).toHaveClass('shadow-lg');
  });

  it('applies interactive variant with hover styles', () => {
    const { container } = render(<Card variant="interactive">Content</Card>);
    expect(container.firstChild).toHaveClass('hover:scale-[1.02]');
  });

  it('applies glass variant', () => {
    const { container } = render(<Card variant="glass">Content</Card>);
    expect(container.firstChild).toHaveClass('backdrop-blur-xl');
  });

  it('renders CardHeader', () => {
    render(
      <Card>
        <CardHeader>Header</CardHeader>
      </Card>
    );
    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  it('renders CardContent', () => {
    render(
      <Card>
        <CardContent>Content</CardContent>
      </Card>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders CardFooter', () => {
    render(
      <Card>
        <CardFooter>Footer</CardFooter>
      </Card>
    );
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});
```

**Step 2: Run test**

```bash
pnpm test tests/unit/components/ui/Card.test.tsx
```

**Step 3: Update Card component**

```tsx
// src/components/ui/Card.tsx
'use client';

import {
  Card as DarwinCard,
  CardHeader as DarwinCardHeader,
  CardContent as DarwinCardContent,
  CardFooter as DarwinCardFooter,
} from '@pikoloo/darwin-ui';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type CardVariant = 'default' | 'elevated' | 'interactive' | 'glass';

interface CardProps extends Omit<ComponentProps<typeof DarwinCard>, 'variant'> {
  variant?: CardVariant;
  children: ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-surface-1 border border-border',
  elevated: 'bg-surface-1 border border-border shadow-lg shadow-black/20',
  interactive: cn(
    'bg-surface-1 border border-border',
    'transition-all duration-[--duration-normal] ease-[--ease-out]',
    'hover:scale-[1.02] hover:-translate-y-0.5',
    'hover:shadow-lg hover:shadow-black/20',
    'hover:border-accent/30'
  ),
  glass: cn(
    'backdrop-blur-xl bg-surface-1/80 border border-border/50',
    'shadow-lg shadow-black/10'
  ),
};

export function Card({ variant = 'default', className, children, ...props }: CardProps) {
  return (
    <DarwinCard
      className={cn(
        'rounded-xl',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </DarwinCard>
  );
}

export function CardHeader({ className, ...props }: ComponentProps<typeof DarwinCardHeader>) {
  return (
    <DarwinCardHeader
      className={cn('p-6 pb-0', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: ComponentProps<typeof DarwinCardContent>) {
  return (
    <DarwinCardContent
      className={cn('p-6', className)}
      {...props}
    />
  );
}

export function CardFooter({ className, ...props }: ComponentProps<typeof DarwinCardFooter>) {
  return (
    <DarwinCardFooter
      className={cn('p-6 pt-0', className)}
      {...props}
    />
  );
}
```

**Step 4: Run tests**

```bash
pnpm test tests/unit/components/ui/Card.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/ui/Card.tsx tests/unit/components/ui/Card.test.tsx
git commit -m "feat(ui): add Card variants (elevated, interactive, glass)"
```

---

## Phase 3: Landing Page Components

### Task 3.1: Redesign Hero Component

**Files:**
- Modify: `src/components/landing/Hero.tsx`
- Modify: `tests/component/landing/Hero.test.tsx`

**Step 1: Update Hero test for new structure**

```tsx
// tests/component/landing/Hero.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Hero } from '@/components/landing';

vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: vi.fn(),
    loading: false,
    user: null,
  }),
}));

describe('Hero', () => {
  it('renders headline', () => {
    render(<Hero />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/keep your code/i);
  });

  it('renders subheadline mentioning AI assistants', () => {
    render(<Hero />);
    expect(screen.getByText(/ai assistants/i)).toBeInTheDocument();
  });

  it('renders badge for target audience', () => {
    render(<Hero />);
    expect(screen.getByText(/for developers/i)).toBeInTheDocument();
  });

  it('renders auth form', () => {
    render(<Hero />);
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });

  it('renders secondary CTA', () => {
    render(<Hero />);
    expect(screen.getByRole('link', { name: /how it works/i })).toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    render(<Hero />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
```

**Step 2: Run test**

```bash
pnpm test tests/component/landing/Hero.test.tsx
```

**Step 3: Implement new Hero component**

```tsx
// src/components/landing/Hero.tsx
'use client';

import { motion } from 'framer-motion';
import { AuthForm } from './AuthForm';
import { Badge } from '@/components/ui/Badge';

export function Hero() {
  return (
    <header role="banner" className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-surface-1 to-background" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-accent/5 rounded-full blur-2xl" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-8"
          >
            <Badge variant="outline" className="text-muted">
              For developers who use AI assistants
            </Badge>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight">
              <span className="text-foreground">Keep Your</span>
              <br />
              <span className="bg-gradient-to-r from-accent to-blue-400 bg-clip-text text-transparent">
                Code Sharp
              </span>
            </h1>

            <p className="text-xl text-muted max-w-lg">
              Practice syntax through spaced repetition.
              <br />
              5 minutes a day to stay fluent.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <AuthForm />
            </div>

            <a
              href="#how-it-works"
              className="inline-flex items-center text-muted hover:text-foreground transition-colors"
            >
              See how it works
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </a>
          </motion.div>

          {/* Right column - Code animation mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="hidden lg:block"
          >
            <div className="relative">
              {/* Glow behind card */}
              <div className="absolute -inset-4 bg-accent/20 rounded-2xl blur-2xl" />

              {/* Mock code card */}
              <div className="relative bg-surface-1 rounded-xl border border-border shadow-2xl overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface-2">
                  <div className="w-3 h-3 rounded-full bg-error/80" />
                  <div className="w-3 h-3 rounded-full bg-warning/80" />
                  <div className="w-3 h-3 rounded-full bg-success/80" />
                  <span className="ml-2 text-sm text-muted">practice.py</span>
                </div>

                {/* Code content */}
                <div className="p-6 font-mono text-sm">
                  <div className="text-muted mb-4"># Print &quot;Hello, World!&quot;</div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.3 }}
                  >
                    <span className="text-[--syntax-function]">print</span>
                    <span className="text-foreground">(</span>
                    <span className="text-[--syntax-string]">&quot;Hello, World!&quot;</span>
                    <span className="text-foreground">)</span>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.2, duration: 0.3 }}
                    className="mt-6 flex items-center gap-2 text-success"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Correct!</span>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </header>
  );
}
```

**Step 4: Run tests**

```bash
pnpm test tests/component/landing/Hero.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/landing/Hero.tsx tests/component/landing/Hero.test.tsx
git commit -m "feat(landing): redesign Hero with gradient text, animations, and code mockup"
```

---

### Task 3.2: Redesign Features Component with Bento Grid

**Files:**
- Modify: `src/components/landing/Features.tsx`
- Modify: `tests/component/landing/Features.test.tsx`

**Step 1: Update Features test**

```tsx
// tests/component/landing/Features.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Features } from '@/components/landing';

describe('Features', () => {
  it('renders section heading', () => {
    render(<Features />);
    expect(screen.getByRole('heading', { name: /why syntaxsrs/i })).toBeInTheDocument();
  });

  it('renders spaced repetition feature', () => {
    render(<Features />);
    expect(screen.getByText(/spaced repetition/i)).toBeInTheDocument();
  });

  it('renders code syntax feature', () => {
    render(<Features />);
    expect(screen.getByText(/code syntax/i)).toBeInTheDocument();
  });

  it('renders progress tracking feature', () => {
    render(<Features />);
    expect(screen.getByText(/progress/i)).toBeInTheDocument();
  });

  it('has proper section semantics', () => {
    render(<Features />);
    expect(screen.getByRole('region', { name: /features/i })).toBeInTheDocument();
  });

  it('renders three feature cards', () => {
    const { container } = render(<Features />);
    const cards = container.querySelectorAll('[data-testid="feature-card"]');
    expect(cards.length).toBe(3);
  });
});
```

**Step 2: Run test**

```bash
pnpm test tests/component/landing/Features.test.tsx
```

**Step 3: Implement new Features component**

```tsx
// src/components/landing/Features.tsx
'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';

const features = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'Spaced Repetition',
    description: 'Science-backed algorithm schedules reviews at optimal intervals for long-term retention.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    title: 'Code Syntax Focus',
    description: 'Practice real programming patterns, not trivia. Write actual code from memory.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    title: 'Track Progress',
    description: 'Build consistency with daily streaks. Watch your accuracy improve over time.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export function Features() {
  return (
    <section
      aria-label="Features"
      role="region"
      className="py-24 px-4 bg-surface-1"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Why SyntaxSRS?
          </h2>
          <p className="text-muted text-lg max-w-2xl mx-auto">
            Stay sharp without the cognitive overhead of remembering what to practice.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <Card
                variant="interactive"
                data-testid="feature-card"
                className="h-full"
              >
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-display font-semibold mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

**Step 4: Run tests**

```bash
pnpm test tests/component/landing/Features.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/landing/Features.tsx tests/component/landing/Features.test.tsx
git commit -m "feat(landing): redesign Features with bento grid, icons, and scroll animations"
```

---

### Task 3.3: Redesign HowItWorks Component

**Files:**
- Modify: `src/components/landing/HowItWorks.tsx`
- Modify: `tests/component/landing/HowItWorks.test.tsx`

**Step 1: Update test**

```tsx
// tests/component/landing/HowItWorks.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HowItWorks } from '@/components/landing';

describe('HowItWorks', () => {
  it('renders section heading', () => {
    render(<HowItWorks />);
    expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument();
  });

  it('renders three steps', () => {
    render(<HowItWorks />);
    expect(screen.getByText(/1/)).toBeInTheDocument();
    expect(screen.getByText(/2/)).toBeInTheDocument();
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it('renders step descriptions', () => {
    render(<HowItWorks />);
    expect(screen.getByText(/daily exercises/i)).toBeInTheDocument();
    expect(screen.getByText(/from memory/i)).toBeInTheDocument();
    expect(screen.getByText(/algorithm/i)).toBeInTheDocument();
  });

  it('has id for anchor link', () => {
    const { container } = render(<HowItWorks />);
    expect(container.querySelector('#how-it-works')).toBeInTheDocument();
  });
});
```

**Step 2: Run test**

```bash
pnpm test tests/component/landing/HowItWorks.test.tsx
```

**Step 3: Implement new HowItWorks**

```tsx
// src/components/landing/HowItWorks.tsx
'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    number: 1,
    title: 'Get Daily Exercises',
    description: 'The algorithm selects exercises based on what you need to review today.',
  },
  {
    number: 2,
    title: 'Type From Memory',
    description: 'Write the code yourself. No multiple choice—real recall builds real skills.',
  },
  {
    number: 3,
    title: 'Algorithm Adapts',
    description: 'Correct answers space out reviews. Mistakes bring cards back sooner.',
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-24 px-4"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold">
            How It Works
          </h2>
        </motion.div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-8 left-[calc(16.67%-12px)] right-[calc(16.67%-12px)] h-0.5 bg-border" />

          <div className="grid md:grid-cols-3 gap-8 md:gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative text-center"
              >
                {/* Step number */}
                <div className="relative z-10 w-16 h-16 mx-auto mb-6 rounded-full bg-accent text-white flex items-center justify-center text-xl font-display font-bold shadow-lg shadow-accent/30">
                  {step.number}
                </div>

                <h3 className="text-lg font-display font-semibold mb-2">
                  {step.title}
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Step 4: Run tests**

```bash
pnpm test tests/component/landing/HowItWorks.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/landing/HowItWorks.tsx tests/component/landing/HowItWorks.test.tsx
git commit -m "feat(landing): redesign HowItWorks with horizontal stepper and animations"
```

---

### Task 3.4: Update LandingHeader with New Styling

**Files:**
- Modify: `src/components/layout/LandingHeader.tsx`
- Modify: `tests/component/layout/LandingHeader.test.tsx`

**Step 1: Update test**

```tsx
// tests/component/layout/LandingHeader.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingHeader } from '@/components/layout';

describe('LandingHeader', () => {
  it('renders logo/brand name', () => {
    render(<LandingHeader />);
    expect(screen.getByText(/syntaxsrs/i)).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<LandingHeader />);
    expect(screen.getByRole('link', { name: /features/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /how it works/i })).toBeInTheDocument();
  });

  it('renders sign in button', () => {
    render(<LandingHeader />);
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('has navigation landmark', () => {
    render(<LandingHeader />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
```

**Step 2: Run test**

```bash
pnpm test tests/component/layout/LandingHeader.test.tsx
```

**Step 3: Implement new LandingHeader**

```tsx
// src/components/layout/LandingHeader.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function LandingHeader() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-xl font-display font-bold text-foreground hover:text-accent transition-colors"
          >
            SyntaxSRS
          </Link>

          {/* Navigation links - hidden on mobile */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              How it works
            </a>
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-4">
            <Link
              href="/auth/signin"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Button size="sm" className="hidden sm:inline-flex">
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

**Step 4: Run tests**

```bash
pnpm test tests/component/layout/LandingHeader.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/layout/LandingHeader.tsx tests/component/layout/LandingHeader.test.tsx
git commit -m "feat(layout): redesign LandingHeader with glassmorphism and sticky behavior"
```

---

## Phase 4: Dashboard Components

### Task 4.1: Update Greeting Component

**Files:**
- Modify: `src/components/dashboard/Greeting.tsx`
- Modify: `tests/component/dashboard/Greeting.test.tsx`

**Step 1: Update test**

```tsx
// tests/component/dashboard/Greeting.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Greeting } from '@/components/dashboard';

describe('Greeting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders morning greeting in the morning', () => {
    vi.setSystemTime(new Date('2024-01-01T09:00:00'));
    render(<Greeting username="Test" />);
    expect(screen.getByText(/good morning/i)).toBeInTheDocument();
  });

  it('renders afternoon greeting in the afternoon', () => {
    vi.setSystemTime(new Date('2024-01-01T14:00:00'));
    render(<Greeting username="Test" />);
    expect(screen.getByText(/good afternoon/i)).toBeInTheDocument();
  });

  it('renders evening greeting in the evening', () => {
    vi.setSystemTime(new Date('2024-01-01T19:00:00'));
    render(<Greeting username="Test" />);
    expect(screen.getByText(/good evening/i)).toBeInTheDocument();
  });

  it('renders username when provided', () => {
    vi.setSystemTime(new Date('2024-01-01T09:00:00'));
    render(<Greeting username="Alice" />);
    expect(screen.getByText(/alice/i)).toBeInTheDocument();
  });

  it('renders subtext', () => {
    vi.setSystemTime(new Date('2024-01-01T09:00:00'));
    render(<Greeting username="Test" subtext="Ready to practice?" />);
    expect(screen.getByText(/ready to practice/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test**

```bash
pnpm test tests/component/dashboard/Greeting.test.tsx
```

**Step 3: Implement updated Greeting**

```tsx
// src/components/dashboard/Greeting.tsx
'use client';

import { motion } from 'framer-motion';

interface GreetingProps {
  username?: string;
  subtext?: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

export function Greeting({ username, subtext }: GreetingProps) {
  const greeting = getGreeting();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-1"
    >
      <h1 className="text-3xl md:text-4xl font-display font-bold">
        {greeting}
        {username && (
          <span className="text-muted">, {username}</span>
        )}
        !
      </h1>
      {subtext && (
        <p className="text-muted text-lg">{subtext}</p>
      )}
    </motion.div>
  );
}
```

**Step 4: Run tests**

```bash
pnpm test tests/component/dashboard/Greeting.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/dashboard/Greeting.tsx tests/component/dashboard/Greeting.test.tsx
git commit -m "feat(dashboard): update Greeting with animations and subtext support"
```

---

### Task 4.2: Redesign StatsCard Component

**Files:**
- Modify: `src/components/dashboard/StatsCard.tsx`
- Modify: `tests/unit/components/dashboard/StatsCard.test.tsx`

**Step 1: Update test**

```tsx
// tests/unit/components/dashboard/StatsCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsCard } from '@/components/dashboard';

describe('StatsCard', () => {
  it('renders label', () => {
    render(<StatsCard label="Streak" value={7} icon="flame" />);
    expect(screen.getByText('Streak')).toBeInTheDocument();
  });

  it('renders value', () => {
    render(<StatsCard label="Streak" value={7} icon="flame" />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders flame icon for streak', () => {
    const { container } = render(<StatsCard label="Streak" value={7} icon="flame" />);
    expect(container.querySelector('[data-icon="flame"]')).toBeInTheDocument();
  });

  it('renders target icon for accuracy', () => {
    const { container } = render(<StatsCard label="Accuracy" value={85} icon="target" suffix="%" />);
    expect(container.querySelector('[data-icon="target"]')).toBeInTheDocument();
  });

  it('renders suffix when provided', () => {
    render(<StatsCard label="Accuracy" value={85} icon="target" suffix="%" />);
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('renders trend when provided', () => {
    render(<StatsCard label="Total" value={100} icon="chart" trend={5} />);
    expect(screen.getByText(/\+5/)).toBeInTheDocument();
  });
});
```

**Step 2: Run test**

```bash
pnpm test tests/unit/components/dashboard/StatsCard.test.tsx
```

**Step 3: Implement new StatsCard**

```tsx
// src/components/dashboard/StatsCard.tsx
'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

type IconType = 'flame' | 'target' | 'chart' | 'trophy' | 'check';

interface StatsCardProps {
  label: string;
  value: number;
  icon: IconType;
  suffix?: string;
  trend?: number;
  className?: string;
}

const icons: Record<IconType, React.ReactNode> = {
  flame: (
    <svg data-icon="flame" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
    </svg>
  ),
  target: (
    <svg data-icon="target" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <circle cx="12" cy="12" r="6" strokeWidth="2" />
      <circle cx="12" cy="12" r="2" strokeWidth="2" />
    </svg>
  ),
  chart: (
    <svg data-icon="chart" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  trophy: (
    <svg data-icon="trophy" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-1.17a3 3 0 01-1.466 1.566l.15 1.9A2 2 0 0111.54 16H8.46a2 2 0 01-1.974-2.534l.15-1.9A3 3 0 015.17 10H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5z" clipRule="evenodd" />
    </svg>
  ),
  check: (
    <svg data-icon="check" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
};

const iconColors: Record<IconType, string> = {
  flame: 'text-orange-500',
  target: 'text-accent',
  chart: 'text-accent',
  trophy: 'text-yellow-500',
  check: 'text-success',
};

export function StatsCard({ label, value, icon, suffix, trend, className }: StatsCardProps) {
  return (
    <Card variant="default" className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted">
              <span className={iconColors[icon]}>{icons[icon]}</span>
              <span className="text-sm font-medium">{label}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <motion.span
                key={value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-display font-bold"
              >
                {value}
              </motion.span>
              {suffix && (
                <span className="text-xl text-muted">{suffix}</span>
              )}
            </div>
          </div>

          {trend !== undefined && trend !== 0 && (
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full',
              trend > 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
            )}>
              {trend > 0 ? '+' : ''}{trend}
              <svg
                className={cn('w-3 h-3', trend < 0 && 'rotate-180')}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 4: Run tests**

```bash
pnpm test tests/unit/components/dashboard/StatsCard.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/dashboard/StatsCard.tsx tests/unit/components/dashboard/StatsCard.test.tsx
git commit -m "feat(dashboard): redesign StatsCard with icons, trends, and animations"
```

---

## Phase 5: Practice Page Components

### Task 5.1: Update CodeInput to Use CodeEditor

**Files:**
- Modify: `src/components/exercise/CodeInput.tsx`
- Modify: `tests/component/exercise/CodeInput.test.tsx`

**Step 1: Update test**

```tsx
// tests/component/exercise/CodeInput.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeInput } from '@/components/exercise';

describe('CodeInput', () => {
  it('renders with placeholder', () => {
    render(<CodeInput value="" onChange={() => {}} onSubmit={() => {}} />);
    expect(screen.getByPlaceholderText(/type your/i)).toBeInTheDocument();
  });

  it('displays value', () => {
    render(<CodeInput value="print('hello')" onChange={() => {}} onSubmit={() => {}} />);
    expect(screen.getByDisplayValue("print('hello')")).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const handleChange = vi.fn();
    render(<CodeInput value="" onChange={handleChange} onSubmit={() => {}} />);

    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'x');

    expect(handleChange).toHaveBeenCalled();
  });

  it('calls onSubmit on Ctrl+Enter', () => {
    const handleSubmit = vi.fn();
    render(<CodeInput value="test" onChange={() => {}} onSubmit={handleSubmit} />);

    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true });

    expect(handleSubmit).toHaveBeenCalled();
  });

  it('applies success state', () => {
    const { container } = render(
      <CodeInput value="" onChange={() => {}} onSubmit={() => {}} state="success" />
    );
    expect(container.querySelector('.border-success')).toBeInTheDocument();
  });

  it('applies error state', () => {
    const { container } = render(
      <CodeInput value="" onChange={() => {}} onSubmit={() => {}} state="error" />
    );
    expect(container.querySelector('.border-error')).toBeInTheDocument();
  });

  it('disables input when disabled prop is true', () => {
    render(<CodeInput value="" onChange={() => {}} onSubmit={() => {}} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
```

**Step 2: Run test**

```bash
pnpm test tests/component/exercise/CodeInput.test.tsx
```

**Step 3: Update CodeInput to use CodeEditor**

```tsx
// src/components/exercise/CodeInput.tsx
'use client';

import { CodeEditor, type CodeEditorState } from '@/components/ui/CodeEditor';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  state?: CodeEditorState;
}

export function CodeInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  state = 'default',
}: CodeInputProps) {
  return (
    <CodeEditor
      value={value}
      onChange={onChange}
      onSubmit={onSubmit}
      disabled={disabled}
      state={state}
      showLineNumbers
      placeholder="# Type your code here..."
      aria-label="Code answer input"
    />
  );
}
```

**Step 4: Run tests**

```bash
pnpm test tests/component/exercise/CodeInput.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/exercise/CodeInput.tsx tests/component/exercise/CodeInput.test.tsx
git commit -m "refactor(exercise): update CodeInput to use CodeEditor with state support"
```

---

### Task 5.2: Update SessionProgress Component

**Files:**
- Modify: `src/components/session/SessionProgress.tsx`
- Modify: `tests/component/session/SessionProgress.test.tsx`

**Step 1: Update test**

```tsx
// tests/component/session/SessionProgress.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SessionProgress } from '@/components/session';

describe('SessionProgress', () => {
  it('renders progress text', () => {
    render(<SessionProgress current={3} total={10} />);
    expect(screen.getByText('3 / 10')).toBeInTheDocument();
  });

  it('renders progress bar', () => {
    render(<SessionProgress current={5} total={10} />);
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '50');
  });

  it('renders segment indicators', () => {
    const { container } = render(<SessionProgress current={3} total={5} />);
    const segments = container.querySelectorAll('[data-segment]');
    expect(segments.length).toBe(5);
  });

  it('marks completed segments', () => {
    const { container } = render(<SessionProgress current={3} total={5} />);
    const completedSegments = container.querySelectorAll('[data-completed="true"]');
    expect(completedSegments.length).toBe(3);
  });

  it('highlights current segment', () => {
    const { container } = render(<SessionProgress current={3} total={5} />);
    const currentSegment = container.querySelector('[data-current="true"]');
    expect(currentSegment).toBeInTheDocument();
  });

  it('renders end session link', () => {
    render(<SessionProgress current={1} total={5} onEndSession={() => {}} />);
    expect(screen.getByRole('button', { name: /end session/i })).toBeInTheDocument();
  });
});
```

**Step 2: Run test**

```bash
pnpm test tests/component/session/SessionProgress.test.tsx
```

**Step 3: Implement new SessionProgress**

```tsx
// src/components/session/SessionProgress.tsx
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SessionProgressProps {
  current: number;
  total: number;
  onEndSession?: () => void;
}

export function SessionProgress({ current, total, onEndSession }: SessionProgressProps) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Segmented progress bar */}
          <div className="flex-1 flex items-center gap-2">
            <div
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              className="flex-1 flex gap-1"
            >
              {Array.from({ length: total }, (_, i) => {
                const isCompleted = i < current;
                const isCurrent = i === current;

                return (
                  <motion.div
                    key={i}
                    data-segment
                    data-completed={isCompleted}
                    data-current={isCurrent}
                    className={cn(
                      'h-2 flex-1 rounded-full transition-all duration-300',
                      isCompleted
                        ? 'bg-accent'
                        : isCurrent
                        ? 'bg-accent/40'
                        : 'bg-surface-2'
                    )}
                    initial={isCompleted ? { scale: 1 } : { scale: 0.95 }}
                    animate={isCompleted ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                );
              })}
            </div>

            <span className="text-sm text-muted font-mono min-w-[60px] text-right">
              {current} / {total}
            </span>
          </div>

          {/* End session */}
          {onEndSession && (
            <button
              onClick={onEndSession}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              End Session
            </button>
          )}
        </div>

        {/* Keyboard hint */}
        <div className="text-xs text-subtle mt-1 text-right">
          <kbd className="px-1.5 py-0.5 bg-surface-2 rounded text-[10px]">⌘</kbd>
          <span className="mx-1">+</span>
          <kbd className="px-1.5 py-0.5 bg-surface-2 rounded text-[10px]">↵</kbd>
          <span className="ml-1">to submit</span>
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Run tests**

```bash
pnpm test tests/component/session/SessionProgress.test.tsx
```
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/session/SessionProgress.tsx tests/component/session/SessionProgress.test.tsx
git commit -m "feat(session): redesign SessionProgress with segmented bar and keyboard hints"
```

---

## Phase 6: Animations & Polish

### Task 6.1: Add Confetti Celebration

**Files:**
- Create: `src/lib/confetti.ts`
- Modify: `src/components/session/SessionSummary.tsx`
- Modify: `tests/component/session/SessionSummary.test.tsx`

**Step 1: Install canvas-confetti**

```bash
pnpm add canvas-confetti
pnpm add -D @types/canvas-confetti
```

**Step 2: Create confetti utility**

```tsx
// src/lib/confetti.ts
import confetti from 'canvas-confetti';

export function celebrateSuccess() {
  // Quick burst of confetti
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'],
  });
}

export function celebrateSessionComplete() {
  // Multiple bursts for session completion
  const duration = 2000;
  const animationEnd = Date.now() + duration;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    confetti({
      particleCount: 50,
      startVelocity: 30,
      spread: 360,
      origin: {
        x: Math.random(),
        y: Math.random() - 0.2,
      },
      colors: ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'],
    });
  }, 250);
}
```

**Step 3: Update SessionSummary test**

```tsx
// tests/component/session/SessionSummary.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SessionSummary } from '@/components/session';

// Mock confetti
vi.mock('@/lib/confetti', () => ({
  celebrateSessionComplete: vi.fn(),
}));

describe('SessionSummary', () => {
  const defaultProps = {
    correct: 8,
    total: 10,
    duration: 240, // 4 minutes
    streakChange: 1,
    onContinue: vi.fn(),
    onDashboard: vi.fn(),
  };

  it('renders completion heading', () => {
    render(<SessionSummary {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /complete/i })).toBeInTheDocument();
  });

  it('renders correct count', () => {
    render(<SessionSummary {...defaultProps} />);
    expect(screen.getByText(/8.*10/)).toBeInTheDocument();
  });

  it('renders duration', () => {
    render(<SessionSummary {...defaultProps} />);
    expect(screen.getByText(/4.*min/i)).toBeInTheDocument();
  });

  it('renders streak change', () => {
    render(<SessionSummary {...defaultProps} />);
    expect(screen.getByText(/\+1/)).toBeInTheDocument();
  });

  it('renders continue button', () => {
    render(<SessionSummary {...defaultProps} />);
    expect(screen.getByRole('button', { name: /continue|practice more/i })).toBeInTheDocument();
  });

  it('renders dashboard button', () => {
    render(<SessionSummary {...defaultProps} />);
    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
  });
});
```

**Step 4: Implement updated SessionSummary**

```tsx
// src/components/session/SessionSummary.tsx
'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { celebrateSessionComplete } from '@/lib/confetti';

interface SessionSummaryProps {
  correct: number;
  total: number;
  duration: number; // in seconds
  streakChange?: number;
  onContinue: () => void;
  onDashboard: () => void;
}

export function SessionSummary({
  correct,
  total,
  duration,
  streakChange = 0,
  onContinue,
  onDashboard,
}: SessionSummaryProps) {
  const accuracy = Math.round((correct / total) * 100);
  const minutes = Math.floor(duration / 60);
  const isGreat = accuracy >= 80;

  useEffect(() => {
    // Trigger confetti on mount
    celebrateSessionComplete();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card variant="elevated" className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-8">
            {/* Heading */}
            <div className="space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="text-6xl"
              >
                {isGreat ? '🎉' : '💪'}
              </motion.div>
              <h1 className="text-3xl font-display font-bold">
                Session Complete!
              </h1>
              <p className="text-muted">
                {isGreat ? 'Great work!' : 'Keep practicing!'}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-1"
              >
                <div className="text-3xl font-display font-bold text-accent">
                  {correct}/{total}
                </div>
                <div className="text-sm text-muted">Correct</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-1"
              >
                <div className="text-3xl font-display font-bold">
                  {minutes}<span className="text-lg text-muted">min</span>
                </div>
                <div className="text-sm text-muted">Duration</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-1"
              >
                <div className="text-3xl font-display font-bold text-orange-500">
                  {streakChange > 0 ? `+${streakChange}` : streakChange}
                  <span className="ml-1">🔥</span>
                </div>
                <div className="text-sm text-muted">Streak</div>
              </motion.div>
            </div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col gap-3"
            >
              <Button onClick={onContinue} glow className="w-full">
                Practice More
              </Button>
              <Button variant="ghost" onClick={onDashboard} className="w-full">
                Back to Dashboard
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
```

**Step 5: Run tests**

```bash
pnpm test tests/component/session/SessionSummary.test.tsx
```
Expected: PASS

**Step 6: Commit**

```bash
git add src/lib/confetti.ts src/components/session/SessionSummary.tsx tests/component/session/SessionSummary.test.tsx package.json pnpm-lock.yaml
git commit -m "feat(session): add confetti celebration to SessionSummary"
```

---

## Phase 7: Documentation & Cleanup

### Task 7.1: Update CLAUDE.md with New Patterns

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add new section to CLAUDE.md**

Add after "darwin-ui (CRITICAL: Always Prefer)" section:

```markdown
### Theme System

The app uses a comprehensive CSS variable-based theme system:

**Dark Mode Default:**
- Dark mode is applied via `class="dark"` on `<html>`
- Always test in dark mode first

**CSS Variables (in globals.css):**
- `--background`, `--surface-1/2/3` - Background layers
- `--foreground`, `--muted`, `--subtle` - Text hierarchy
- `--accent`, `--success`, `--warning`, `--error` - Semantic colors
- `--syntax-*` - Syntax highlighting colors

**Font Families:**
- `font-display` (Space Grotesk) - Headings, display text
- `font-sans` (DM Sans) - Body text
- `font-mono` (JetBrains Mono) - Code

**Utility Classes:**
- `glow-success`, `glow-accent`, `glow-error` - Glow effects
- `card-elevated` - Deep shadow
- `glass` - Glassmorphism effect

### Animation Patterns

Use framer-motion for animations:

```tsx
import { motion } from 'framer-motion';

// Fade in with slide
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
/>

// Staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
```

**Duration tokens:**
- `--duration-fast`: 150ms (hovers, button states)
- `--duration-normal`: 200ms (card transitions)
- `--duration-slow`: 300ms (page transitions)
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add theme system and animation patterns to CLAUDE.md"
```

---

### Task 7.2: Run Full Test Suite and Fix Any Failures

**Step 1: Run all tests**

```bash
pnpm test:run
```

**Step 2: Fix any failures** (iterate as needed)

**Step 3: Run typecheck**

```bash
pnpm typecheck
```

**Step 4: Run lint**

```bash
pnpm lint
```

**Step 5: Run build**

```bash
pnpm build
```
Expected: All pass

**Step 6: Final commit**

```bash
git add -A
git commit -m "chore: fix any test/type/lint issues from UI redesign"
```

---

### Task 7.3: Update Obsidian Documentation

**Files:**
- Modify: Obsidian vault `Features.md`

**Step 1: Add completed milestone**

Add to Features.md completed section:
```markdown
## Completed

### UI Redesign (2026-01-04)
- Dark mode default with comprehensive theme system
- New typography: Space Grotesk (display), DM Sans (body), JetBrains Mono (code)
- Redesigned landing page with animated hero, bento feature grid
- Enhanced dashboard with animated stats cards
- Editor-style code input with line numbers and state styling
- Confetti celebrations on session completion
- Micro-interactions throughout (hover, focus, success states)
```

**Step 2: Commit any remaining changes**

```bash
git add -A
git commit -m "docs: update Obsidian Features.md with UI redesign milestone"
```

---

## Summary

**Total Tasks:** 17 tasks across 7 phases
**Estimated Changes:** ~25 files modified/created
**Test Coverage:** All existing tests maintained, new tests for new features

**Key Deliverables:**
1. Theme system with dark mode default
2. New font stack (Space Grotesk, DM Sans, JetBrains Mono)
3. Enhanced UI components (Button, Card, CodeEditor)
4. Redesigned landing page (Hero, Features, HowItWorks, Header)
5. Redesigned dashboard (Greeting, StatsCard)
6. Editor-style code input with syntax highlighting feel
7. Session progress with segmented bar
8. Confetti celebrations
9. Documentation updates

---

## Execution Checklist

- [ ] Phase 1: Foundation (Tasks 1.1-1.4)
- [ ] Phase 2: Core UI (Tasks 2.1-2.3)
- [ ] Phase 3: Landing (Tasks 3.1-3.4)
- [ ] Phase 4: Dashboard (Tasks 4.1-4.2)
- [ ] Phase 5: Practice (Tasks 5.1-5.2)
- [ ] Phase 6: Animations (Task 6.1)
- [ ] Phase 7: Docs (Tasks 7.1-7.3)
