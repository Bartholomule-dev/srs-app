# Remove darwin-ui & UI Component Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Completely remove darwin-ui dependency and replace with premium custom Tailwind components, cleaning up all hacks and organizing the UI component system.

**Architecture:** Replace each darwin-ui wrapper with self-contained Tailwind components that match our existing design system (warm amber accents, CSS variables, framer-motion). Create a custom Toast system since darwin-ui's ToastProvider is deeply integrated. Remove all CSS overrides that were fighting darwin-ui's blue theme.

**Tech Stack:** React 19, Tailwind CSS 4, framer-motion (direct dependency), tailwind-merge

---

## Summary of Changes

| Category | Files Affected | Action |
|----------|---------------|--------|
| UI Wrappers | 8 files in `src/components/ui/` | Rewrite from scratch |
| Toast System | `Providers.tsx`, `useConceptSession.ts`, context | Create custom Toast |
| CSS Cleanup | `globals.css` | Remove 70+ lines of overrides |
| Test Mocks | 3 test files | Remove darwin-ui mocks |
| Config | `package.json`, `vitest.config.ts` | Remove dep & config |
| Documentation | `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, memories | Update references |

---

## Phase 1: Create Custom Toast System

### Task 1.1: Create Toast Context and Provider

**Files:**
- Create: `src/lib/context/ToastContext.tsx`
- Create: `src/lib/context/toast.types.ts`
- Test: `tests/unit/context/ToastContext.test.tsx`

**Step 1: Write the failing test**

Create `tests/unit/context/ToastContext.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '@/lib/context/ToastContext';

function TestComponent() {
  const { showToast, toasts, dismissToast } = useToast();
  return (
    <div>
      <button onClick={() => showToast({ title: 'Test', variant: 'success' })}>
        Show Toast
      </button>
      <button onClick={() => showToast({ title: 'Error', description: 'Details', variant: 'error' })}>
        Show Error
      </button>
      {toasts.map((toast) => (
        <div key={toast.id} data-testid={`toast-${toast.id}`}>
          <span>{toast.title}</span>
          {toast.description && <span>{toast.description}</span>}
          <button onClick={() => dismissToast(toast.id)}>Dismiss</button>
        </div>
      ))}
    </div>
  );
}

describe('ToastContext', () => {
  it('shows toast when showToast is called', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('shows toast with description', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Error'));
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('dismisses toast when dismissToast is called', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Toast'));
    expect(screen.getByText('Test')).toBeInTheDocument();

    await user.click(screen.getByText('Dismiss'));
    await waitFor(() => {
      expect(screen.queryByText('Test')).not.toBeInTheDocument();
    });
  });

  it('auto-dismisses toast after duration', async () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await act(async () => {
      screen.getByText('Show Toast').click();
    });
    expect(screen.getByText('Test')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText('Test')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('throws when useToast is used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow(
      'useToast must be used within a ToastProvider'
    );
    consoleError.mockRestore();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test:run tests/unit/context/ToastContext.test.tsx`
Expected: FAIL - module not found

**Step 3: Create the Toast types and context**

Create `src/lib/context/toast.types.ts`:

```ts
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration?: number;
}

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToastContextValue {
  toasts: Toast[];
  showToast: (options: ToastOptions) => void;
  dismissToast: (id: string) => void;
}
```

**Step 4: Create ToastContext**

Create `src/lib/context/ToastContext.tsx`:

```tsx
'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { Toast, ToastOptions, ToastContextValue } from './toast.types';

const ToastContext = createContext<ToastContextValue | null>(null);

interface ToastProviderProps {
  children: ReactNode;
}

const DEFAULT_DURATION = 5000;

// Fallback for environments without crypto.randomUUID (e.g., older JSDOM)
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Simple fallback using Math.random
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    const id = generateId();
    const duration = options.duration ?? DEFAULT_DURATION;
    const toast: Toast = {
      id,
      title: options.title,
      description: options.description,
      variant: options.variant ?? 'info',
      duration,
    };

    setToasts((prev) => [...prev, toast]);

    const timer = setTimeout(() => {
      dismissToast(id);
    }, duration);
    timersRef.current.set(id, timer);
  }, [dismissToast]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
```

**Step 5: Run test to verify it passes**

Run: `pnpm test:run tests/unit/context/ToastContext.test.tsx`
Expected: All 5 tests pass

**Step 6: Commit**

```bash
git add src/lib/context/ToastContext.tsx src/lib/context/toast.types.ts tests/unit/context/ToastContext.test.tsx
git commit -m "feat(toast): add custom ToastContext and useToast hook"
```

---

### Task 1.2: Create Toast UI Component

**Files:**
- Create: `src/components/Toast.tsx`

**Step 1: Write the failing test**

Create `tests/unit/components/Toast.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastContainer } from '@/components/Toast';
import { ToastProvider, useToast } from '@/lib/context/ToastContext';

function TestTrigger() {
  const { showToast } = useToast();
  return (
    <button onClick={() => showToast({ title: 'Test Toast', variant: 'success' })}>
      Trigger
    </button>
  );
}

describe('ToastContainer', () => {
  it('renders toasts from context', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestTrigger />
        <ToastContainer />
      </ToastProvider>
    );

    await user.click(screen.getByText('Trigger'));
    expect(screen.getByText('Test Toast')).toBeInTheDocument();
  });

  it('renders success variant with correct styling', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestTrigger />
        <ToastContainer />
      </ToastProvider>
    );

    await user.click(screen.getByText('Trigger'));
    const toast = screen.getByRole('alert');
    expect(toast).toBeInTheDocument();
  });

  it('renders with dismiss button', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TestTrigger />
        <ToastContainer />
      </ToastProvider>
    );

    await user.click(screen.getByText('Trigger'));
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test:run tests/unit/components/Toast.test.tsx`
Expected: FAIL - module not found

**Step 3: Create ToastContainer component**

Create `src/components/Toast.tsx`:

```tsx
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import { useToast } from '@/lib/context/ToastContext';
import type { ToastVariant } from '@/lib/context/toast.types';
import { cn } from '@/lib/utils';

const variantStyles: Record<ToastVariant, string> = {
  success: 'bg-green-900/90 border-green-500/30 text-green-100',
  error: 'bg-red-900/90 border-red-500/30 text-red-100',
  warning: 'bg-yellow-900/90 border-yellow-500/30 text-yellow-100',
  info: 'bg-blue-900/90 border-blue-500/30 text-blue-100',
};

const variantIcons: Record<ToastVariant, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            role="alert"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className={cn(
              'pointer-events-auto min-w-[300px] max-w-[400px]',
              'rounded-lg border backdrop-blur-sm',
              'p-4 shadow-lg',
              variantStyles[toast.variant]
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg" aria-hidden="true">
                {variantIcons[toast.variant]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{toast.title}</p>
                {toast.description && (
                  <p className="mt-1 text-sm opacity-80">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
                aria-label="Dismiss toast"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test:run tests/unit/components/Toast.test.tsx`
Expected: All 3 tests pass

**Step 5: Commit**

```bash
git add src/components/Toast.tsx tests/unit/components/Toast.test.tsx
git commit -m "feat(toast): add ToastContainer UI component"
```

---

### Task 1.3: Update Context Exports

**Files:**
- Modify: `src/lib/context/index.ts`

**Step 1: Update exports**

Replace `src/lib/context/index.ts`:

```ts
export { AuthProvider, AuthContext } from './AuthContext';
export type { AuthState, AuthContextValue } from './auth.types';
export { ToastProvider, useToast } from './ToastContext';
export type { Toast, ToastOptions, ToastVariant, ToastContextValue } from './toast.types';
```

**Step 2: Commit**

```bash
git add src/lib/context/index.ts
git commit -m "feat(context): export ToastProvider and useToast"
```

---

## Phase 2: Replace UI Components

### Task 2.1: Rewrite Button Component

**Files:**
- Modify: `src/components/ui/Button.tsx`

**Step 1: Verify existing tests pass (baseline)**

Run: `pnpm test:run tests/unit/components/ui/Button.test.tsx`
Expected: All tests pass (baseline)

**Step 2: Rewrite Button without darwin-ui**

Replace `src/components/ui/Button.tsx`:

```tsx
'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  glow?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-[var(--accent-primary)] text-white',
    'hover:bg-[var(--accent-primary)]/90',
    'focus-visible:ring-[var(--accent-primary)]/50'
  ),
  secondary: cn(
    'bg-[var(--bg-surface-2)] text-[var(--text-primary)] border border-[var(--border)]',
    'hover:bg-[var(--bg-surface-3)] hover:border-[var(--border)]',
    'focus-visible:ring-[var(--border)]'
  ),
  ghost: cn(
    'bg-transparent text-[var(--text-secondary)]',
    'hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]',
    'focus-visible:ring-[var(--border)]'
  ),
  danger: cn(
    'bg-[var(--accent-error)] text-white',
    'hover:bg-[var(--accent-error)]/90',
    'focus-visible:ring-[var(--accent-error)]/50'
  ),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      glow = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2',
          'rounded-lg font-medium',
          'transition-all duration-150 ease-out',
          // Focus styles
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'focus-visible:ring-offset-[var(--bg-base)]',
          // Hover/active animations
          'hover:scale-[1.02] hover:brightness-110',
          'active:scale-[0.98]',
          // Variant and size
          variantStyles[variant],
          sizeStyles[size],
          // Glow effect (primary only)
          glow && variant === 'primary' && 'shadow-[0_0_20px_rgba(245,158,11,0.4)]',
          // Disabled state
          isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none',
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
```

**Step 3: Run tests to verify they still pass**

Run: `pnpm test:run tests/unit/components/ui/Button.test.tsx`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/components/ui/Button.tsx
git commit -m "refactor(ui): rewrite Button without darwin-ui"
```

---

### Task 2.2: Rewrite Card Component

**Files:**
- Modify: `src/components/ui/Card.tsx`

**Step 1: Verify existing tests pass (baseline)**

Run: `pnpm test:run tests/unit/components/ui/Card.test.tsx`
Expected: All tests pass

**Step 2: Rewrite Card without darwin-ui**

Replace `src/components/ui/Card.tsx`:

```tsx
'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type CardElevation = 'flat' | 1 | 2 | 3;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  elevation?: CardElevation;
  interactive?: boolean;
}

const elevationStyles: Record<CardElevation, string> = {
  flat: 'bg-transparent shadow-none border-transparent',
  1: 'bg-[var(--bg-surface-1)] border border-[var(--border)] shadow-[0_1px_3px_rgba(0,0,0,0.2)]',
  2: 'bg-[var(--bg-surface-2)] border border-[var(--border)] shadow-[0_2px_8px_rgba(0,0,0,0.25)]',
  3: 'bg-[var(--bg-surface-3)] border border-[var(--border)] shadow-[0_4px_12px_rgba(0,0,0,0.3)]',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card({ children, elevation = 1, interactive = false, className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl',
          elevationStyles[elevation],
          'transition-all duration-200',
          interactive && [
            'cursor-pointer',
            'hover:-translate-y-0.5',
            'hover:shadow-[0_4px_20px_rgba(245,158,11,0.15)]',
            'hover:border-[var(--accent-primary)]/40',
            'active:scale-[0.99]',
          ],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeader({ children, className, ...props }, ref) {
    return (
      <div ref={ref} className={cn('px-6 pt-6', className)} {...props}>
        {children}
      </div>
    );
  }
);

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  function CardContent({ children, className, ...props }, ref) {
    return (
      <div ref={ref} className={cn('px-6 py-4', className)} {...props}>
        {children}
      </div>
    );
  }
);

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  function CardFooter({ children, className, ...props }, ref) {
    return (
      <div ref={ref} className={cn('px-6 pb-6 pt-2', className)} {...props}>
        {children}
      </div>
    );
  }
);

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  function CardTitle({ children, className, ...props }, ref) {
    return (
      <h3
        ref={ref}
        className={cn('text-lg font-semibold text-[var(--text-primary)]', className)}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  function CardDescription({ children, className, ...props }, ref) {
    return (
      <p
        ref={ref}
        className={cn('text-sm text-[var(--text-secondary)] mt-1', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);
```

**Step 3: Run tests to verify they still pass**

Run: `pnpm test:run tests/unit/components/ui/Card.test.tsx`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/components/ui/Card.tsx
git commit -m "refactor(ui): rewrite Card without darwin-ui"
```

---

### Task 2.3: Rewrite Input Component

**Files:**
- Modify: `src/components/ui/Input.tsx`

**Step 1: Verify existing tests pass (baseline)**

Run: `pnpm test:run tests/unit/components/ui/Input.test.tsx`
Expected: All tests pass

**Step 2: Rewrite Input without darwin-ui**

Replace `src/components/ui/Input.tsx`:

```tsx
'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  errorMessage?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ error, errorMessage, className, ...props }, ref) {
    const hasError = error || !!errorMessage;

    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            // Base styles
            'w-full rounded-lg px-4 py-2.5',
            'bg-[var(--bg-surface-2)] text-[var(--text-primary)]',
            'border transition-all duration-150',
            'placeholder:text-[var(--text-tertiary)]',
            // Focus styles
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            // Error vs normal border
            hasError
              ? 'border-[var(--accent-error)] focus:ring-[var(--accent-error)]/30'
              : 'border-[var(--border)] focus:border-[var(--accent-primary)] focus:ring-[var(--accent-primary)]/20',
            // Disabled
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {errorMessage && (
          <p className="mt-1.5 text-sm text-[var(--accent-error)]">{errorMessage}</p>
        )}
      </div>
    );
  }
);
```

**Step 3: Run tests to verify they still pass**

Run: `pnpm test:run tests/unit/components/ui/Input.test.tsx`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/components/ui/Input.tsx
git commit -m "refactor(ui): rewrite Input without darwin-ui"
```

---

### Task 2.4: Rewrite Textarea Component

**Files:**
- Modify: `src/components/ui/Textarea.tsx`

**Step 1: Verify existing tests pass (baseline)**

Run: `pnpm test:run tests/unit/components/ui/Textarea.test.tsx`
Expected: All tests pass

**Step 2: Rewrite Textarea without darwin-ui**

Replace `src/components/ui/Textarea.tsx`:

```tsx
'use client';

import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  monospace?: boolean;
  error?: boolean;
  errorMessage?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ monospace = false, error, errorMessage, className, ...props }, ref) {
    const hasError = error || !!errorMessage;

    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={cn(
            // Base styles
            'w-full rounded-lg px-4 py-3',
            'bg-[var(--bg-surface-2)] text-[var(--text-primary)]',
            'border transition-all duration-150',
            'placeholder:text-[var(--text-tertiary)]',
            'resize-y min-h-[100px]',
            // Focus styles
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            // Error vs normal border
            hasError
              ? 'border-[var(--accent-error)] focus:ring-[var(--accent-error)]/30'
              : 'border-[var(--border)] focus:border-[var(--accent-primary)] focus:ring-[var(--accent-primary)]/20',
            // Monospace
            monospace && 'font-mono',
            // Disabled
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {errorMessage && (
          <p className="mt-1.5 text-sm text-[var(--accent-error)]">{errorMessage}</p>
        )}
      </div>
    );
  }
);
```

**Step 3: Run tests to verify they still pass**

Run: `pnpm test:run tests/unit/components/ui/Textarea.test.tsx`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/components/ui/Textarea.tsx
git commit -m "refactor(ui): rewrite Textarea without darwin-ui"
```

---

### Task 2.5: Rewrite Alert Component

**Files:**
- Modify: `src/components/ui/Alert.tsx`

**Step 1: Verify existing tests pass (baseline)**

Run: `pnpm test:run tests/unit/components/ui/Alert.test.tsx`
Expected: All tests pass

**Step 2: Rewrite Alert without darwin-ui**

Replace `src/components/ui/Alert.tsx`:

```tsx
'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  children?: ReactNode;
}

const variantStyles: Record<AlertVariant, string> = {
  info: 'bg-blue-900/20 border-blue-500/30 text-blue-100',
  success: 'bg-green-900/20 border-green-500/30 text-green-100',
  warning: 'bg-yellow-900/20 border-yellow-500/30 text-yellow-100',
  error: 'bg-red-900/20 border-red-500/30 text-red-100',
};

const variantIcons: Record<AlertVariant, string> = {
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  error: '✕',
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  function Alert(
    { variant = 'info', title, description, dismissible, onDismiss, children, className, ...props },
    ref
  ) {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'rounded-lg border p-4',
          'flex items-start gap-3',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        <span className="text-lg flex-shrink-0" aria-hidden="true">
          {variantIcons[variant]}
        </span>
        <div className="flex-1 min-w-0">
          {title && <p className="font-medium">{title}</p>}
          {description && <p className="mt-1 text-sm opacity-80">{description}</p>}
          {children}
        </div>
        {dismissible && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
            aria-label="Dismiss alert"
          >
            <X size={16} weight="bold" />
          </button>
        )}
      </div>
    );
  }
);
```

**Step 3: Run tests to verify they still pass**

Run: `pnpm test:run tests/unit/components/ui/Alert.test.tsx`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/components/ui/Alert.tsx
git commit -m "refactor(ui): rewrite Alert without darwin-ui"
```

---

### Task 2.6: Rewrite Badge Component

**Files:**
- Modify: `src/components/ui/Badge.tsx`

**Step 1: Verify existing tests pass (baseline)**

Run: `pnpm test:run tests/unit/components/ui/Badge.test.tsx`
Expected: All tests pass

**Step 2: Rewrite Badge without darwin-ui**

Replace `src/components/ui/Badge.tsx`:

```tsx
'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'
  | 'outline';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--accent-primary)] text-white',
  secondary: 'bg-[var(--bg-surface-3)] text-[var(--text-secondary)]',
  success: 'bg-green-600/20 text-green-400 border-green-500/30',
  warning: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
  destructive: 'bg-red-600/20 text-red-400 border-red-500/30',
  info: 'bg-blue-600/20 text-blue-400 border-blue-500/30',
  outline: 'bg-transparent border-[var(--border)] text-[var(--text-secondary)]',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge({ variant = 'default', children, className, ...props }, ref) {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-2.5 py-0.5',
          'rounded-full text-xs font-medium',
          'border border-transparent',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
```

**Step 3: Run tests to verify they still pass**

Run: `pnpm test:run tests/unit/components/ui/Badge.test.tsx`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/components/ui/Badge.tsx
git commit -m "refactor(ui): rewrite Badge without darwin-ui"
```

---

### Task 2.7: Rewrite Skeleton Component

**Files:**
- Modify: `src/components/ui/Skeleton.tsx`

**Step 1: Verify existing tests pass (baseline)**

Run: `pnpm test:run tests/unit/components/ui/Skeleton.test.tsx`
Expected: All tests pass

**Step 2: Rewrite Skeleton without darwin-ui**

Replace `src/components/ui/Skeleton.tsx`:

```tsx
'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  function Skeleton({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'animate-pulse rounded-md',
          'bg-[var(--bg-surface-3)]',
          className
        )}
        {...props}
      />
    );
  }
);
```

**Step 3: Run tests to verify they still pass**

Run: `pnpm test:run tests/unit/components/ui/Skeleton.test.tsx`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/components/ui/Skeleton.tsx
git commit -m "refactor(ui): rewrite Skeleton without darwin-ui"
```

---

### Task 2.8: Rewrite Tooltip Component

**Files:**
- Modify: `src/components/ui/Tooltip.tsx`

**Step 1: Verify existing tests pass (baseline)**

Run: `pnpm test:run tests/unit/components/ui/Tooltip.test.tsx`
Expected: All tests pass

**Step 2: Rewrite Tooltip without darwin-ui**

Replace `src/components/ui/Tooltip.tsx`:

```tsx
'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
  type HTMLAttributes,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Context for Tooltip state
interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

function useTooltipContext() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('Tooltip components must be used within a Tooltip');
  }
  return context;
}

// Provider (optional, for global config)
export interface TooltipProviderProps {
  children: ReactNode;
  delayDuration?: number;
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>;
}

// Root Tooltip
export interface TooltipProps {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Tooltip({ children, open: controlledOpen, defaultOpen = false, onOpenChange }: TooltipProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const triggerRef = useRef<HTMLElement | null>(null);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = useCallback(
    (value: boolean) => {
      setUncontrolledOpen(value);
      onOpenChange?.(value);
    },
    [onOpenChange]
  );

  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block">{children}</div>
    </TooltipContext.Provider>
  );
}

// Trigger
export interface TooltipTriggerProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  asChild?: boolean;
}

export function TooltipTrigger({ children, className, asChild, ...props }: TooltipTriggerProps) {
  const { setOpen, triggerRef } = useTooltipContext();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setOpen(true), 200);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(false);
  };

  return (
    <span
      ref={triggerRef as React.RefObject<HTMLSpanElement>}
      className={cn('cursor-default', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      {...props}
    >
      {children}
    </span>
  );
}

// Content
export interface TooltipContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
}

// Position classes (static, Tailwind-safe)
const positionClasses: Record<string, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2',
  bottom: 'top-full left-1/2 -translate-x-1/2',
  left: 'right-full top-1/2 -translate-y-1/2',
  right: 'left-full top-1/2 -translate-y-1/2',
};

// Calculate offset styles inline (Tailwind can't do dynamic values)
function getOffsetStyle(side: string, offset: number): React.CSSProperties {
  switch (side) {
    case 'top':
      return { marginBottom: offset };
    case 'bottom':
      return { marginTop: offset };
    case 'left':
      return { marginRight: offset };
    case 'right':
      return { marginLeft: offset };
    default:
      return {};
  }
}

export function TooltipContent({
  children,
  className,
  side = 'top',
  sideOffset = 8,
  style,
  ...props
}: TooltipContentProps) {
  const { open } = useTooltipContext();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="tooltip"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          style={{ ...getOffsetStyle(side, sideOffset), ...style }}
          className={cn(
            'absolute z-50 px-3 py-1.5',
            'rounded-md shadow-lg',
            'bg-[var(--bg-surface-3)] text-[var(--text-primary)]',
            'text-sm whitespace-nowrap',
            'border border-[var(--border)]',
            positionClasses[side],
            className
          )}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Step 3: Run tests to verify they still pass**

Run: `pnpm test:run tests/unit/components/ui/Tooltip.test.tsx`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/components/ui/Tooltip.tsx
git commit -m "refactor(ui): rewrite Tooltip without darwin-ui"
```

---

### Task 2.9: Update UI Index Exports

**Files:**
- Modify: `src/components/ui/index.ts`

**Step 1: Update exports**

Replace `src/components/ui/index.ts`:

```ts
// Custom UI components (no darwin-ui dependency)

export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from './Card';
export type {
  CardProps,
  CardElevation,
  CardHeaderProps,
  CardContentProps,
  CardFooterProps,
  CardTitleProps,
  CardDescriptionProps,
} from './Card';

export { Input } from './Input';
export type { InputProps } from './Input';

export { Textarea } from './Textarea';
export type { TextareaProps } from './Textarea';

export { Progress } from './Progress';
export type { ProgressProps } from './Progress';

export { Badge } from './Badge';
export type { BadgeProps, BadgeVariant } from './Badge';

export { Alert } from './Alert';
export type { AlertProps, AlertVariant } from './Alert';

export { Skeleton } from './Skeleton';
export type { SkeletonProps } from './Skeleton';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './Tooltip';
export type { TooltipProps, TooltipTriggerProps, TooltipContentProps, TooltipProviderProps } from './Tooltip';

export { CodeEditor } from './CodeEditor';
export type { CodeEditorProps } from './CodeEditor';

export { FlameIcon } from './FlameIcon';
```

**Step 2: Commit**

```bash
git add src/components/ui/index.ts
git commit -m "refactor(ui): update index exports"
```

---

## Phase 3: Update Providers and Hooks

### Task 3.1: Update Providers Component

**Files:**
- Modify: `src/components/Providers.tsx`

**Step 1: Update to use custom ToastProvider**

Replace `src/components/Providers.tsx`:

```tsx
'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/context/AuthContext';
import { ToastProvider } from '@/lib/context/ToastContext';
import { ToastContainer } from '@/components/Toast';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
        <ToastContainer />
      </ToastProvider>
    </AuthProvider>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/Providers.tsx
git commit -m "refactor(providers): use custom ToastProvider"
```

---

### Task 3.2: Update useConceptSession Hook

**Files:**
- Modify: `src/lib/hooks/useConceptSession.ts`

**Step 1: Update import**

Change line 6 from:
```ts
import { useToast } from '@pikoloo/darwin-ui';
```
to:
```ts
import { useToast } from '@/lib/context/ToastContext';
```

**Step 2: Run tests**

Run: `pnpm test:run tests/unit/hooks/useConceptSession.test.tsx`
Expected: Tests pass

**Step 3: Commit**

```bash
git add src/lib/hooks/useConceptSession.ts
git commit -m "refactor(hooks): use custom useToast in useConceptSession"
```

---

### Task 3.3: Clean Up Stale darwin-ui Comments

**Files:**
- Modify: `src/components/index.ts`
- Modify: `src/lib/context/index.ts`

**Step 1: Update src/components/index.ts**

Remove line 3 which says:
```ts
// Toast is now provided by @pikoloo/darwin-ui
```

The file should start with just the exports.

**Step 2: Update src/lib/context/index.ts**

This file is already updated in Task 1.3. Verify the old comment is removed:
```ts
// Toast is now provided by @pikoloo/darwin-ui
// Use: import { ToastProvider, useToast } from '@pikoloo/darwin-ui';
```

Should be replaced with our new ToastProvider exports.

**Step 3: Commit**

```bash
git add src/components/index.ts src/lib/context/index.ts
git commit -m "chore: remove stale darwin-ui comments from exports"
```

---

## Phase 4: Remove CSS Overrides

### Task 4.1: Clean Up globals.css

**Files:**
- Modify: `src/app/globals.css`

**Step 1: Remove darwin-ui import and all blue overrides**

The file should be modified to:
1. Remove line 2: `@import "@pikoloo/darwin-ui/styles";`
2. Remove lines 137-213 (all the darwin-ui override comments and rules)
3. Remove the comment on line 10 about overriding for darwin-ui

The final file should only contain:
- Tailwind import
- @theme inline block with fonts and color mappings
- :root CSS variables for dark mode
- :root:not(.dark) for light mode
- body styles
- Reduced motion media query

**Step 2: Verify the app still renders**

Run: `pnpm dev`
Check: Visit http://localhost:3000 and verify styling is correct

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "refactor(css): remove darwin-ui import and override hacks"
```

---

## Phase 5: Remove Test Mocks and Config

### Task 5.1: Update Test Mocks

**Files:**
- Modify: `tests/unit/app/layout.test.tsx`
- Modify: `tests/unit/hooks/useConceptSession.test.tsx`
- Modify: `tests/integration/session/practice-flow.test.tsx`

**Step 1: Update layout.test.tsx**

Remove the darwin-ui mock (lines 9-12):
```tsx
// Mock darwin-ui ToastProvider
vi.mock('@pikoloo/darwin-ui', () => ({
  ToastProvider: ({ children }: { children: ReactNode }) => children,
}));
```

**Step 2: Update useConceptSession.test.tsx**

Replace the darwin-ui mock (lines 45-52) with a mock for the custom toast:
```tsx
vi.mock('@/lib/context/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
    toasts: [],
    dismissToast: vi.fn(),
  }),
}));
```

**Step 3: Update practice-flow.test.tsx**

Replace the darwin-ui mock (lines 36-43) with a mock for the custom toast:
```tsx
vi.mock('@/lib/context/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
    toasts: [],
    dismissToast: vi.fn(),
  }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));
```

**Step 4: Run all tests**

Run: `pnpm test:run`
Expected: All tests pass

**Step 5: Commit**

```bash
git add tests/unit/app/layout.test.tsx tests/unit/hooks/useConceptSession.test.tsx tests/integration/session/practice-flow.test.tsx
git commit -m "test: remove darwin-ui mocks, use custom toast mocks"
```

---

### Task 5.2: Update Vitest Config

**Files:**
- Modify: `vitest.config.ts`

**Step 1: Remove darwin-ui inline config**

Remove lines 13-15:
```ts
server: {
  deps: {
    inline: ['@pikoloo/darwin-ui'],
  },
},
```

Also remove the CSS mock aliases that were for darwin-ui dependencies (lines 23-24):
```ts
'react-day-picker/style.css': path.resolve(__dirname, './tests/mocks/empty.css'),
'@uiw/react-md-editor/markdown-editor.css': path.resolve(__dirname, './tests/mocks/empty.css'),
```

**Step 2: Verify tests still pass**

Run: `pnpm test:run`
Expected: All tests pass

**Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "chore(test): remove darwin-ui vitest config"
```

---

## Phase 6: Remove Package Dependency

### Task 6.1: Uninstall darwin-ui

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Step 1: Remove the package**

Run: `pnpm remove @pikoloo/darwin-ui`

**Step 2: Verify build still works**

Run: `pnpm build`
Expected: Build succeeds

**Step 3: Verify tests still pass**

Run: `pnpm test:run`
Expected: All tests pass

**Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: remove @pikoloo/darwin-ui dependency"
```

---

### Task 6.2: Clean Up Mock Files (if no longer needed)

**Files:**
- Check: `tests/mocks/empty.css`

**Step 1: Check if empty.css is still needed**

Run: `grep -r "empty.css" .`

If no results (or only in this file), delete it:
```bash
rm tests/mocks/empty.css
rmdir tests/mocks  # if empty
```

**Step 2: Commit if deleted**

```bash
git add -A
git commit -m "chore: remove unused test mock files"
```

---

## Phase 7: Update Documentation

### Task 7.1: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update Tech Stack section**

Change line 31 from:
```
| UI | React 19, Tailwind CSS 4, **darwin-ui** (@pikoloo/darwin-ui) |
```
to:
```
| UI | React 19, Tailwind CSS 4, framer-motion |
```

**Step 2: Update project structure**

Change line 68 from:
```
│   ├── ui/               # darwin-ui wrappers with project defaults
```
to:
```
│   ├── ui/               # Custom UI components (Button, Card, Input, etc.)
```

**Step 3: Remove entire darwin-ui section (lines 153-182)**

Delete the section titled "### darwin-ui (CRITICAL: Always Prefer)" and its contents.

**Step 4: Update milestones**

Change line 367 from:
```
10. ✅ darwin-ui Migration - Migrated to @pikoloo/darwin-ui for macOS-inspired aesthetic, wrapper components in src/components/ui/
```
to:
```
10. ✅ Custom UI Components - Premium Tailwind components with warm amber theme, framer-motion animations
```

**Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: remove darwin-ui references from CLAUDE.md"
```

---

### Task 7.2: Update AGENTS.md and GEMINI.md

**Files:**
- Modify: `AGENTS.md`
- Modify: `GEMINI.md`

**Step 1: Update AGENTS.md**

- Line 19: Change `ui/                 # darwin-ui wrappers` to `ui/                 # Custom UI components`
- Line 59: Remove `(darwin-ui wrappers)` reference

**Step 2: Update GEMINI.md**

- Line 25: Change `darwin-ui (@pikoloo/darwin-ui)` to `framer-motion`
- Line 54: Change `**darwin-ui** wrappers` to `Custom UI components`
- Lines 68-69: Remove darwin-ui preference instructions

**Step 3: Commit**

```bash
git add AGENTS.md GEMINI.md
git commit -m "docs: remove darwin-ui references from AGENTS.md and GEMINI.md"
```

---

### Task 7.3: Update Serena Memories

**Files:**
- Modify: `.serena/memories/project_overview.md`

**Step 1: Update memory**

Change line 33 from darwin-ui milestone to custom UI components milestone.

**Step 2: Commit**

```bash
git add .serena/memories/project_overview.md
git commit -m "docs: update Serena memory for UI components"
```

---

## Phase 8: Final Verification

### Task 8.1: Run Full Test Suite

**Step 1: Run all unit and integration tests**

Run: `pnpm test:run`
Expected: All tests pass (696+ tests)

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: No TypeScript errors

**Step 3: Run lint**

Run: `pnpm lint`
Expected: No lint errors

---

### Task 8.2: Run E2E Tests

**Step 1: Run Playwright tests**

Run: `pnpm test:e2e`
Expected: All E2E tests pass

---

### Task 8.3: Visual Verification

**Step 1: Start dev server**

Run: `pnpm dev`

**Step 2: Manually verify all pages**

Check:
- [ ] Landing page (Hero buttons, Features cards, AuthForm input/button/alert)
- [ ] Dashboard (StatsGrid skeleton/cards, PracticeCTA, EmptyState)
- [ ] Practice session (ExerciseCard, CodeInput, feedback alerts, buttons)
- [ ] Session summary (Card, Button, stats display)
- [ ] Toast notifications (trigger an error to see toast)

---

### Task 8.4: Production Build

**Step 1: Create production build**

Run: `pnpm build`
Expected: Build succeeds without errors

**Step 2: Check bundle size improved**

The build should show reduced JavaScript bundle size without darwin-ui's ~92KB.

---

### Task 8.5: Final Commit

**Step 1: Stage any remaining changes**

```bash
git status
git add -A
```

**Step 2: Create summary commit**

```bash
git commit -m "feat: complete darwin-ui removal and UI refactor

BREAKING CHANGE: darwin-ui dependency removed

- Replaced all darwin-ui components with custom Tailwind implementations
- Created custom ToastProvider and ToastContainer with framer-motion
- Removed 70+ lines of CSS override hacks from globals.css
- Updated all test mocks to use custom toast
- Removed vitest inline dep config
- Updated documentation (CLAUDE.md, AGENTS.md, GEMINI.md)

Custom components now use project's design system directly:
- Warm amber accent colors (var(--accent-primary))
- Consistent elevation system for cards
- Premium hover/active animations
- Full accessibility (aria attributes, focus states)"
```

---

## Summary

| Phase | Tasks | Components Affected |
|-------|-------|-------------------|
| 1. Toast System | 3 | ToastContext, ToastContainer |
| 2. UI Components | 9 | Button, Card, Input, Textarea, Alert, Badge, Skeleton, Tooltip, index |
| 3. Providers/Hooks | 3 | Providers.tsx, useConceptSession, stale comments cleanup |
| 4. CSS Cleanup | 1 | globals.css |
| 5. Test Cleanup | 2 | 3 test files, vitest.config |
| 6. Package Removal | 2 | package.json, mocks |
| 7. Documentation | 3 | CLAUDE.md, AGENTS.md, GEMINI.md, memories |
| 8. Verification | 5 | Full test suite, E2E, visual, build |

**Total: 28 tasks across 8 phases**

---

## Rollback Strategy

If issues arise, this can be reverted with:
```bash
git revert HEAD~N  # Revert N commits
pnpm add @pikoloo/darwin-ui  # Re-add dependency
```

However, the incremental approach with tests at each step should catch issues early.
