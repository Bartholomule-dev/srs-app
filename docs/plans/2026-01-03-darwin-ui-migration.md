# Darwin UI Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate SRS-App from custom Tailwind components to Darwin UI for a polished macOS-inspired aesthetic.

**Architecture:** Incremental migration using wrapper components. Each darwin-ui component is wrapped in a project-specific component under `src/components/ui/` to maintain API consistency and enable future customization. Existing components are updated to import from the new wrappers.

**Tech Stack:** Darwin UI (`@pikoloo/darwin-ui`), Framer Motion, React 19, Tailwind CSS 4

---

## Phase 1: Foundation Setup

### Task 1.1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install darwin-ui and framer-motion**

Run:
```bash
pnpm add @pikoloo/darwin-ui framer-motion
```

Expected: Dependencies added to package.json

**Step 2: Verify installation**

Run:
```bash
pnpm list @pikoloo/darwin-ui framer-motion
```

Expected: Both packages listed with versions

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add darwin-ui and framer-motion dependencies"
```

---

### Task 1.2: Configure Darwin UI Styles

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Add darwin-ui styles import**

Add after line 1 (`@import "tailwindcss";`):

```css
@import '@pikoloo/darwin-ui/styles';
```

Full file becomes:
```css
@import "tailwindcss";
@import '@pikoloo/darwin-ui/styles';

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

**Step 2: Run dev server to verify no style conflicts**

Run:
```bash
pnpm dev
```

Expected: App starts without CSS errors, visit http://localhost:3000

**Step 3: Run tests to verify nothing broken**

Run:
```bash
pnpm test:run
```

Expected: All 429 tests pass

**Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "chore: add darwin-ui styles to global CSS"
```

---

### Task 1.3: Create UI Component Directory Structure

**Files:**
- Create: `src/components/ui/index.ts`

**Step 1: Create UI directory with barrel export**

```typescript
// src/components/ui/index.ts
// Darwin UI wrapper components
// Re-export darwin-ui components with project-specific defaults

export { Button } from './Button';
export { Card } from './Card';
export { Input } from './Input';
export { Textarea } from './Textarea';
export { Progress } from './Progress';
export { Badge } from './Badge';
export { Alert } from './Alert';
export { Skeleton } from './Skeleton';
export { Tooltip } from './Tooltip';
```

**Step 2: Commit**

```bash
git add src/components/ui/index.ts
git commit -m "chore: create ui component directory structure"
```

---

## Phase 2: Core Primitive Wrappers

### Task 2.1: Create Button Wrapper

**Files:**
- Create: `src/components/ui/Button.tsx`
- Create: `tests/unit/components/ui/Button.test.tsx`

**Step 1: Write the failing test**

```typescript
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
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm test:run tests/unit/components/ui/Button.test.tsx
```

Expected: FAIL - module not found

**Step 3: Write the Button wrapper**

```typescript
// src/components/ui/Button.tsx
'use client';

import { Button as DarwinButton } from '@pikoloo/darwin-ui';
import type { ComponentProps } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends Omit<ComponentProps<typeof DarwinButton>, 'variant'> {
  variant?: ButtonVariant;
  loading?: boolean;
}

const variantMap: Record<ButtonVariant, ComponentProps<typeof DarwinButton>['variant']> = {
  primary: 'filled',
  secondary: 'outline',
  ghost: 'ghost',
  danger: 'destructive',
};

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <DarwinButton
      variant={variantMap[variant]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </DarwinButton>
  );
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
pnpm test:run tests/unit/components/ui/Button.test.tsx
```

Expected: All 5 tests pass

**Step 5: Commit**

```bash
git add src/components/ui/Button.tsx tests/unit/components/ui/Button.test.tsx
git commit -m "feat(ui): add Button wrapper for darwin-ui"
```

---

### Task 2.2: Create Card Wrapper

**Files:**
- Create: `src/components/ui/Card.tsx`
- Create: `tests/unit/components/ui/Card.test.tsx`

**Step 1: Write the failing test**

```typescript
// tests/unit/components/ui/Card.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('supports custom className', () => {
    render(<Card className="custom-class">Content</Card>);
    expect(screen.getByText('Content').parentElement).toHaveClass('custom-class');
  });

  it('renders with header, content, and footer', () => {
    render(
      <Card>
        <CardHeader>Header</CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );

    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm test:run tests/unit/components/ui/Card.test.tsx
```

Expected: FAIL - module not found

**Step 3: Write the Card wrapper**

```typescript
// src/components/ui/Card.tsx
'use client';

import { Card as DarwinCard } from '@pikoloo/darwin-ui';
import type { ComponentProps, ReactNode } from 'react';

export interface CardProps extends ComponentProps<typeof DarwinCard> {
  children: ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <DarwinCard className={className} {...props}>
      {children}
    </DarwinCard>
  );
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mt-4 ${className}`}>{children}</div>;
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
pnpm test:run tests/unit/components/ui/Card.test.tsx
```

Expected: All 3 tests pass

**Step 5: Commit**

```bash
git add src/components/ui/Card.tsx tests/unit/components/ui/Card.test.tsx
git commit -m "feat(ui): add Card wrapper for darwin-ui"
```

---

### Task 2.3: Create Input Wrapper

**Files:**
- Create: `src/components/ui/Input.tsx`
- Create: `tests/unit/components/ui/Input.test.tsx`

**Step 1: Write the failing test**

```typescript
// tests/unit/components/ui/Input.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/Input';

describe('Input', () => {
  it('renders with placeholder', () => {
    render(<Input placeholder="Enter email" />);
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);

    await user.type(screen.getByRole('textbox'), 'test');
    expect(onChange).toHaveBeenCalled();
  });

  it('supports disabled state', () => {
    render(<Input disabled placeholder="Disabled" />);
    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
  });

  it('supports error state', () => {
    render(<Input error="This field is required" placeholder="With error" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm test:run tests/unit/components/ui/Input.test.tsx
```

Expected: FAIL - module not found

**Step 3: Write the Input wrapper**

```typescript
// src/components/ui/Input.tsx
'use client';

import { Input as DarwinInput } from '@pikoloo/darwin-ui';
import type { ComponentProps } from 'react';

export interface InputProps extends ComponentProps<typeof DarwinInput> {
  error?: string;
}

export function Input({ error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      <DarwinInput className={className} {...props} />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
pnpm test:run tests/unit/components/ui/Input.test.tsx
```

Expected: All 4 tests pass

**Step 5: Commit**

```bash
git add src/components/ui/Input.tsx tests/unit/components/ui/Input.test.tsx
git commit -m "feat(ui): add Input wrapper for darwin-ui"
```

---

### Task 2.4: Create Textarea Wrapper

**Files:**
- Create: `src/components/ui/Textarea.tsx`
- Create: `tests/unit/components/ui/Textarea.test.tsx`

**Step 1: Write the failing test**

```typescript
// tests/unit/components/ui/Textarea.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '@/components/ui/Textarea';

describe('Textarea', () => {
  it('renders with placeholder', () => {
    render(<Textarea placeholder="Enter code" />);
    expect(screen.getByPlaceholderText('Enter code')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textarea onChange={onChange} />);

    await user.type(screen.getByRole('textbox'), 'code');
    expect(onChange).toHaveBeenCalled();
  });

  it('supports monospace font', () => {
    render(<Textarea monospace placeholder="Code" />);
    expect(screen.getByPlaceholderText('Code')).toHaveClass('font-mono');
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
pnpm test:run tests/unit/components/ui/Textarea.test.tsx
```

Expected: FAIL - module not found

**Step 3: Write the Textarea wrapper**

```typescript
// src/components/ui/Textarea.tsx
'use client';

import { Textarea as DarwinTextarea } from '@pikoloo/darwin-ui';
import type { ComponentProps } from 'react';

export interface TextareaProps extends ComponentProps<typeof DarwinTextarea> {
  monospace?: boolean;
}

export function Textarea({ monospace = false, className = '', ...props }: TextareaProps) {
  const fontClass = monospace ? 'font-mono' : '';
  return (
    <DarwinTextarea className={`${fontClass} ${className}`.trim()} {...props} />
  );
}
```

**Step 4: Run test to verify it passes**

Run:
```bash
pnpm test:run tests/unit/components/ui/Textarea.test.tsx
```

Expected: All 3 tests pass

**Step 5: Commit**

```bash
git add src/components/ui/Textarea.tsx tests/unit/components/ui/Textarea.test.tsx
git commit -m "feat(ui): add Textarea wrapper for darwin-ui"
```

---

### Task 2.5: Create Remaining Primitive Wrappers

**Files:**
- Create: `src/components/ui/Progress.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/Alert.tsx`
- Create: `src/components/ui/Skeleton.tsx`
- Create: `src/components/ui/Tooltip.tsx`

**Step 1: Create Progress wrapper**

```typescript
// src/components/ui/Progress.tsx
'use client';

import { Progress as DarwinProgress } from '@pikoloo/darwin-ui';
import type { ComponentProps } from 'react';

export interface ProgressProps extends ComponentProps<typeof DarwinProgress> {
  /** Current value (0-100 or custom max) */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
}

export function Progress({ value, max = 100, ...props }: ProgressProps) {
  return <DarwinProgress value={value} max={max} {...props} />;
}
```

**Step 2: Create Badge wrapper**

```typescript
// src/components/ui/Badge.tsx
'use client';

import { Badge as DarwinBadge } from '@pikoloo/darwin-ui';
import type { ComponentProps, ReactNode } from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface BadgeProps extends Omit<ComponentProps<typeof DarwinBadge>, 'variant'> {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge({ variant = 'default', children, ...props }: BadgeProps) {
  return (
    <DarwinBadge variant={variant} {...props}>
      {children}
    </DarwinBadge>
  );
}
```

**Step 3: Create Alert wrapper**

```typescript
// src/components/ui/Alert.tsx
'use client';

import { Alert as DarwinAlert } from '@pikoloo/darwin-ui';
import type { ComponentProps, ReactNode } from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps extends Omit<ComponentProps<typeof DarwinAlert>, 'variant'> {
  variant?: AlertVariant;
  children: ReactNode;
}

export function Alert({ variant = 'info', children, ...props }: AlertProps) {
  return (
    <DarwinAlert variant={variant} {...props}>
      {children}
    </DarwinAlert>
  );
}
```

**Step 4: Create Skeleton wrapper**

```typescript
// src/components/ui/Skeleton.tsx
'use client';

import { Skeleton as DarwinSkeleton } from '@pikoloo/darwin-ui';
import type { ComponentProps } from 'react';

export interface SkeletonProps extends ComponentProps<typeof DarwinSkeleton> {
  /** Width of skeleton (CSS value) */
  width?: string | number;
  /** Height of skeleton (CSS value) */
  height?: string | number;
}

export function Skeleton({ width, height, className = '', ...props }: SkeletonProps) {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return <DarwinSkeleton className={className} style={style} {...props} />;
}
```

**Step 5: Create Tooltip wrapper**

```typescript
// src/components/ui/Tooltip.tsx
'use client';

import { Tooltip as DarwinTooltip } from '@pikoloo/darwin-ui';
import type { ComponentProps, ReactNode } from 'react';

export interface TooltipProps extends ComponentProps<typeof DarwinTooltip> {
  content: ReactNode;
  children: ReactNode;
}

export function Tooltip({ content, children, ...props }: TooltipProps) {
  return (
    <DarwinTooltip content={content} {...props}>
      {children}
    </DarwinTooltip>
  );
}
```

**Step 6: Run all tests**

Run:
```bash
pnpm test:run
```

Expected: All tests pass (existing + new)

**Step 7: Commit**

```bash
git add src/components/ui/Progress.tsx src/components/ui/Badge.tsx src/components/ui/Alert.tsx src/components/ui/Skeleton.tsx src/components/ui/Tooltip.tsx
git commit -m "feat(ui): add Progress, Badge, Alert, Skeleton, Tooltip wrappers"
```

---

## Phase 3: Migrate AuthForm

### Task 3.1: Update AuthForm to Use Darwin UI Components

**Files:**
- Modify: `src/components/landing/AuthForm.tsx`

**Step 1: Run existing AuthForm tests to establish baseline**

Run:
```bash
pnpm test:run tests/unit/components/landing/AuthForm.test.tsx
```

Expected: Tests pass (if exist) or skip to implementation

**Step 2: Update AuthForm imports and components**

Replace the entire file:

```typescript
// src/components/landing/AuthForm.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export function AuthForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setMessage(null);

    try {
      await signIn(email);
      setMessage({ type: 'success', text: 'Check your email for the login link!' });
      setEmail('');
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Something went wrong',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm" id="auth">
      <div className="flex flex-col gap-3">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" loading={sending} className="w-full">
          {sending ? 'Sending...' : 'Send Magic Link'}
        </Button>
      </div>
      {message && (
        <Alert
          variant={message.type === 'success' ? 'success' : 'error'}
          className="mt-3"
        >
          {message.text}
        </Alert>
      )}
    </form>
  );
}
```

**Step 3: Run tests to verify migration**

Run:
```bash
pnpm test:run
```

Expected: All tests pass

**Step 4: Visual verification**

Run:
```bash
pnpm dev
```

Visit http://localhost:3000 and verify AuthForm looks correct

**Step 5: Commit**

```bash
git add src/components/landing/AuthForm.tsx
git commit -m "refactor(AuthForm): migrate to darwin-ui Input, Button, Alert"
```

---

## Phase 4: Migrate Dashboard Components

### Task 4.1: Migrate StatsCard

**Files:**
- Modify: `src/components/dashboard/StatsCard.tsx`

**Step 1: Update StatsCard to use Card wrapper**

```typescript
// src/components/dashboard/StatsCard.tsx
'use client';

import { Card } from '@/components/ui/Card';

export interface StatsCardProps {
  label: string;
  value: number;
  suffix?: string;
  icon?: 'fire' | 'target' | 'trophy' | 'check';
  className?: string;
}

const iconMap: Record<string, string> = {
  fire: '🔥',
  target: '🎯',
  trophy: '🏆',
  check: '✓',
};

export function StatsCard({
  label,
  value,
  suffix = '',
  icon,
  className = '',
}: StatsCardProps) {
  return (
    <Card className={className}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-lg" aria-hidden="true">{iconMap[icon]}</span>}
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
        {suffix}
      </div>
    </Card>
  );
}
```

**Step 2: Run tests**

Run:
```bash
pnpm test:run tests/unit/components/dashboard/StatsCard.test.tsx
```

Expected: Tests pass

**Step 3: Commit**

```bash
git add src/components/dashboard/StatsCard.tsx
git commit -m "refactor(StatsCard): migrate to darwin-ui Card"
```

---

### Task 4.2: Migrate StatsGrid Skeleton

**Files:**
- Modify: `src/components/dashboard/StatsGrid.tsx`

**Step 1: Update StatsGrid skeleton to use Skeleton wrapper**

Replace the skeleton loader section with darwin-ui Skeleton component.

**Step 2: Run tests**

Run:
```bash
pnpm test:run tests/unit/components/dashboard/StatsGrid.test.tsx
```

Expected: Tests pass

**Step 3: Commit**

```bash
git add src/components/dashboard/StatsGrid.tsx
git commit -m "refactor(StatsGrid): migrate skeleton to darwin-ui"
```

---

### Task 4.3: Migrate PracticeCTA

**Files:**
- Modify: `src/components/dashboard/PracticeCTA.tsx`

**Step 1: Update PracticeCTA to use Card and Button**

Import Card and Button from ui/, update the component structure.

**Step 2: Run tests and verify**

**Step 3: Commit**

```bash
git add src/components/dashboard/PracticeCTA.tsx
git commit -m "refactor(PracticeCTA): migrate to darwin-ui Card, Button"
```

---

### Task 4.4: Migrate DueCardsBanner

**Files:**
- Modify: `src/components/dashboard/DueCardsBanner.tsx`

**Step 1: Update to use Card/Alert and Button**

**Step 2: Run tests and verify**

**Step 3: Commit**

```bash
git add src/components/dashboard/DueCardsBanner.tsx
git commit -m "refactor(DueCardsBanner): migrate to darwin-ui components"
```

---

### Task 4.5: Migrate EmptyState

**Files:**
- Modify: `src/components/dashboard/EmptyState.tsx`

**Step 1: Update to use Card and Button**

**Step 2: Run tests and verify**

**Step 3: Commit**

```bash
git add src/components/dashboard/EmptyState.tsx
git commit -m "refactor(EmptyState): migrate to darwin-ui Card, Button"
```

---

## Phase 5: Migrate Exercise Components

### Task 5.1: Migrate CodeInput

**Files:**
- Modify: `src/components/exercise/CodeInput.tsx`

**Step 1: Update to use Textarea wrapper with monospace**

```typescript
// Replace input with darwin-ui Textarea
import { Textarea } from '@/components/ui/Textarea';

// Use: <Textarea monospace ... />
```

**Step 2: Run tests**

Run:
```bash
pnpm test:run tests/unit/components/exercise/CodeInput.test.tsx
```

**Step 3: Commit**

```bash
git add src/components/exercise/CodeInput.tsx
git commit -m "refactor(CodeInput): migrate to darwin-ui Textarea"
```

---

### Task 5.2: Migrate ExerciseCard Container

**Files:**
- Modify: `src/components/exercise/ExerciseCard.tsx`

**Step 1: Update container to use Card, Button, and Badge**

- Replace outer div with Card component
- Replace buttons with Button component
- Add Badge for language/category

**Step 2: Run tests**

Run:
```bash
pnpm test:run tests/unit/components/exercise/ExerciseCard.test.tsx
```

**Step 3: Commit**

```bash
git add src/components/exercise/ExerciseCard.tsx
git commit -m "refactor(ExerciseCard): migrate to darwin-ui Card, Button, Badge"
```

---

### Task 5.3: Migrate ExerciseFeedback

**Files:**
- Modify: `src/components/exercise/ExerciseFeedback.tsx`

**Step 1: Update to use Alert for feedback messages**

- Use Alert variant="success" for correct
- Use Alert variant="error" for incorrect
- Use Button for continue action

**Step 2: Run tests**

**Step 3: Commit**

```bash
git add src/components/exercise/ExerciseFeedback.tsx
git commit -m "refactor(ExerciseFeedback): migrate to darwin-ui Alert, Button"
```

---

### Task 5.4: Migrate HintButton

**Files:**
- Modify: `src/components/exercise/HintButton.tsx`

**Step 1: Update to use Button and Tooltip/Reveal**

- Use Button variant="ghost" for hint trigger
- Use darwin-ui Reveal or Tooltip for hint display

**Step 2: Run tests**

**Step 3: Commit**

```bash
git add src/components/exercise/HintButton.tsx
git commit -m "refactor(HintButton): migrate to darwin-ui Button, Reveal"
```

---

## Phase 6: Migrate Session Components

### Task 6.1: Migrate SessionProgress

**Files:**
- Modify: `src/components/session/SessionProgress.tsx`

**Step 1: Update to use Progress wrapper**

```typescript
import { Progress } from '@/components/ui/Progress';

// Replace custom progress bar with:
<Progress value={current} max={total} />
```

**Step 2: Run tests**

**Step 3: Commit**

```bash
git add src/components/session/SessionProgress.tsx
git commit -m "refactor(SessionProgress): migrate to darwin-ui Progress"
```

---

### Task 6.2: Migrate SessionSummary

**Files:**
- Modify: `src/components/session/SessionSummary.tsx`

**Step 1: Update to use Card and Button**

- Use Card for the summary container
- Use Button for continue/done actions

**Step 2: Run tests**

**Step 3: Commit**

```bash
git add src/components/session/SessionSummary.tsx
git commit -m "refactor(SessionSummary): migrate to darwin-ui Card, Button"
```

---

## Phase 7: Migrate Landing Components

### Task 7.1: Migrate Features Section

**Files:**
- Modify: `src/components/landing/Features.tsx`

**Step 1: Update feature cards to use Card**

**Step 2: Run tests and verify**

**Step 3: Commit**

```bash
git add src/components/landing/Features.tsx
git commit -m "refactor(Features): migrate to darwin-ui Card"
```

---

### Task 7.2: Migrate HowItWorks Section

**Files:**
- Modify: `src/components/landing/HowItWorks.tsx`

**Step 1: Update styling to match darwin-ui aesthetic**

**Step 2: Commit**

```bash
git add src/components/landing/HowItWorks.tsx
git commit -m "refactor(HowItWorks): align with darwin-ui styling"
```

---

## Phase 8: Migrate Utility Components

### Task 8.1: Migrate Toast Component

**Files:**
- Modify: `src/components/Toast.tsx`

**Step 1: Update to use darwin-ui Toast**

```typescript
import { Toast as DarwinToast } from '@pikoloo/darwin-ui';
```

**Step 2: Run tests**

**Step 3: Commit**

```bash
git add src/components/Toast.tsx
git commit -m "refactor(Toast): migrate to darwin-ui Toast"
```

---

## Phase 9: Final Verification

### Task 9.1: Run Full Test Suite

**Step 1: Run all tests**

Run:
```bash
pnpm test:run
```

Expected: All 429+ tests pass

**Step 2: Run typecheck**

Run:
```bash
pnpm typecheck
```

Expected: No TypeScript errors

**Step 3: Run lint**

Run:
```bash
pnpm lint
```

Expected: No lint errors

---

### Task 9.2: Run E2E Tests

**Step 1: Run Playwright tests**

Run:
```bash
pnpm test:e2e
```

Expected: All E2E tests pass

---

### Task 9.3: Visual Regression Check

**Step 1: Start dev server and manually verify all pages**

Run:
```bash
pnpm dev
```

Check:
- [ ] Landing page (Hero, Features, HowItWorks, AuthForm)
- [ ] Dashboard (Greeting, PracticeCTA, StatsGrid, EmptyState)
- [ ] Practice session (ExerciseCard, Progress, Feedback)
- [ ] Session summary

---

### Task 9.4: Production Build

**Step 1: Create production build**

Run:
```bash
pnpm build
```

Expected: Build succeeds without errors

**Step 2: Final commit**

```bash
git add -A
git commit -m "feat: complete darwin-ui migration

- Migrated all components to darwin-ui wrappers
- Added Button, Card, Input, Textarea, Progress, Badge, Alert, Skeleton, Tooltip
- Updated AuthForm, Dashboard, Exercise, Session, Landing components
- All tests passing, production build verified"
```

---

## Summary

| Phase | Tasks | Estimated Components |
|-------|-------|---------------------|
| 1. Foundation | 3 | Setup only |
| 2. Primitives | 5 | 9 wrappers |
| 3. AuthForm | 1 | 1 component |
| 4. Dashboard | 5 | 5 components |
| 5. Exercise | 4 | 4 components |
| 6. Session | 2 | 2 components |
| 7. Landing | 2 | 2 components |
| 8. Utility | 1 | 1 component |
| 9. Verification | 4 | Testing only |

**Total: 27 tasks across 9 phases**

---

## Rollback Strategy

If issues arise, each phase can be reverted independently:

```bash
git revert HEAD~N  # Revert N commits
```

The wrapper pattern means darwin-ui can be swapped out by updating only the `src/components/ui/` files.
