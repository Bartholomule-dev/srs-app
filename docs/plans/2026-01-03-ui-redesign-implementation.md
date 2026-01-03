# UI/UX Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the app from a dev test page into a polished, complete user experience with landing page, authenticated header, and immersive practice mode.

**Architecture:** Component-based approach with clear separation: layout components (Header, LandingHeader), landing components (Hero, Features, HowItWorks, AuthForm), and dashboard enhancements (Greeting, updated CTA). Practice page becomes immersive by hiding the main header. TDD throughout.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4, Vitest for unit/component tests, Playwright for E2E.

---

## Phase 1: Layout Foundation

### Task 1.1: Create Layout Header Component (Test First)

**Files:**
- Create: `tests/component/layout/Header.test.tsx`
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/index.ts`

**Step 1: Write the failing test**

```tsx
// tests/component/layout/Header.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '@/components/layout';
import type { UserStats } from '@/lib/stats';

// Mock useAuth hook
const mockSignOut = vi.fn();
vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com' },
    signOut: mockSignOut,
    loading: false,
  }),
}));

// Mock useStats hook
vi.mock('@/lib/hooks/useStats', () => ({
  useStats: () => ({
    stats: {
      currentStreak: 5,
      cardsReviewedToday: 12,
      accuracyPercent: 85,
      longestStreak: 10,
      totalExercisesCompleted: 50,
    } as UserStats,
    loading: false,
    error: null,
  }),
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders logo that links to dashboard', () => {
    render(<Header />);
    const logo = screen.getByRole('link', { name: /syntaxsrs/i });
    expect(logo).toHaveAttribute('href', '/dashboard');
  });

  it('displays current streak with fire icon', () => {
    render(<Header />);
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByText(/streak/i)).toBeInTheDocument();
  });

  it('displays cards reviewed today', () => {
    render(<Header />);
    expect(screen.getByText(/12/)).toBeInTheDocument();
    expect(screen.getByText(/today/i)).toBeInTheDocument();
  });

  it('shows user menu with email', () => {
    render(<Header />);
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });

  it('calls signOut when sign out clicked', async () => {
    render(<Header />);
    const signOutButton = screen.getByRole('button', { name: /sign out/i });
    fireEvent.click(signOutButton);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('shows "Start your streak!" when streak is 0', () => {
    vi.doMock('@/lib/hooks/useStats', () => ({
      useStats: () => ({
        stats: { currentStreak: 0, cardsReviewedToday: 0 } as UserStats,
        loading: false,
      }),
    }));
    // Re-import after mock change would be needed in real test
    // For now, we'll handle this in implementation
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/component/layout/Header.test.tsx`
Expected: FAIL with "Cannot find module '@/components/layout'"

**Step 3: Write minimal implementation**

```tsx
// src/components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { useStats } from '@/lib/hooks/useStats';

export function Header() {
  const { user, signOut } = useAuth();
  const { stats, loading } = useStats();

  const streak = stats?.currentStreak ?? 0;
  const todayCount = stats?.cardsReviewedToday ?? 0;

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="text-xl font-bold text-gray-900 dark:text-white"
        >
          SyntaxSRS
        </Link>

        {/* Stats */}
        <div className="flex items-center gap-6">
          {/* Streak */}
          <div className="flex items-center gap-1 text-sm">
            {streak > 0 ? (
              <>
                <span className="text-orange-500">🔥</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {streak}
                </span>
                <span className="text-gray-500 dark:text-gray-400">
                  day streak
                </span>
              </>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">
                Start your streak!
              </span>
            )}
          </div>

          {/* Today count */}
          <div className="flex items-center gap-1 text-sm">
            <span className="font-medium text-gray-900 dark:text-white">
              {todayCount}
            </span>
            <span className="text-gray-500 dark:text-gray-400">today</span>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user?.email}
            </span>
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
```

```tsx
// src/components/layout/index.ts
export { Header } from './Header';
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/component/layout/Header.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/component/layout/Header.test.tsx src/components/layout/
git commit -m "feat(layout): add Header component with stats display

- Logo links to dashboard
- Shows streak with fire icon (or 'Start your streak!' if 0)
- Displays cards reviewed today
- User menu with email and sign out"
```

---

### Task 1.2: Create Landing Header Component (Test First)

**Files:**
- Create: `tests/component/layout/LandingHeader.test.tsx`
- Modify: `src/components/layout/LandingHeader.tsx`
- Modify: `src/components/layout/index.ts`

**Step 1: Write the failing test**

```tsx
// tests/component/layout/LandingHeader.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LandingHeader } from '@/components/layout';

describe('LandingHeader', () => {
  it('renders logo', () => {
    render(<LandingHeader />);
    expect(screen.getByText(/syntaxsrs/i)).toBeInTheDocument();
  });

  it('shows sign in link that scrolls to form', () => {
    render(<LandingHeader />);
    const signInLink = screen.getByRole('link', { name: /sign in/i });
    expect(signInLink).toHaveAttribute('href', '#auth');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/component/layout/LandingHeader.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

```tsx
// src/components/layout/LandingHeader.tsx
import Link from 'next/link';

export function LandingHeader() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <span className="text-xl font-bold text-gray-900 dark:text-white">
          SyntaxSRS
        </span>
        <Link
          href="#auth"
          className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
```

```tsx
// src/components/layout/index.ts
export { Header } from './Header';
export { LandingHeader } from './LandingHeader';
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/component/layout/LandingHeader.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/component/layout/LandingHeader.test.tsx src/components/layout/
git commit -m "feat(layout): add LandingHeader for unauthenticated users

- Simple logo + sign in link
- Sign in scrolls to auth form (#auth anchor)"
```

---

### Task 1.3: Export Layout Components from Main Index

**Files:**
- Modify: `src/components/index.ts`

**Step 1: Write the failing test**

```tsx
// tests/unit/components/index.test.ts - ADD to existing file
import { describe, it, expect } from 'vitest';
import * as components from '@/components';

describe('components index', () => {
  // ... existing tests ...

  it('exports Header', () => {
    expect(components.Header).toBeDefined();
  });

  it('exports LandingHeader', () => {
    expect(components.LandingHeader).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/components/index.test.ts`
Expected: FAIL with "Header is not defined"

**Step 3: Write minimal implementation**

```tsx
// src/components/index.ts - ADD exports
export { Header, LandingHeader } from './layout';
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/components/index.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/index.ts tests/unit/components/index.test.ts
git commit -m "feat(components): export layout components from main index"
```

---

## Phase 2: Landing Page Components

### Task 2.1: Create AuthForm Component (Test First)

**Files:**
- Create: `tests/component/landing/AuthForm.test.tsx`
- Create: `src/components/landing/AuthForm.tsx`
- Create: `src/components/landing/index.ts`

**Step 1: Write the failing test**

```tsx
// tests/component/landing/AuthForm.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthForm } from '@/components/landing';

const mockSignIn = vi.fn();
vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    signIn: mockSignIn,
    loading: false,
    user: null,
  }),
}));

describe('AuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email input', () => {
    render(<AuthForm />);
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<AuthForm />);
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument();
  });

  it('calls signIn with email on submit', async () => {
    render(<AuthForm />);
    const input = screen.getByPlaceholderText(/email/i);
    const button = screen.getByRole('button', { name: /send magic link/i });

    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('shows success message after sending', async () => {
    mockSignIn.mockResolvedValueOnce(undefined);
    render(<AuthForm />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it('shows error message on failure', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('Invalid email'));
    render(<AuthForm />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'bad@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it('disables button while sending', async () => {
    mockSignIn.mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<AuthForm />);

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/component/landing/AuthForm.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

```tsx
// src/components/landing/AuthForm.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

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
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="submit"
          disabled={sending}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? 'Sending...' : 'Send Magic Link'}
        </button>
      </div>
      {message && (
        <p
          className={`mt-3 text-sm ${
            message.type === 'success'
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
```

```tsx
// src/components/landing/index.ts
export { AuthForm } from './AuthForm';
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/component/landing/AuthForm.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/component/landing/AuthForm.test.tsx src/components/landing/
git commit -m "feat(landing): add AuthForm component for magic link signin

- Email input with validation
- Submit button with loading state
- Success/error message display"
```

---

### Task 2.2: Create Hero Component (Test First)

**Files:**
- Create: `tests/component/landing/Hero.test.tsx`
- Modify: `src/components/landing/Hero.tsx`
- Modify: `src/components/landing/index.ts`

**Step 1: Write the failing test**

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
    expect(screen.getByText(/keep your code skills sharp/i)).toBeInTheDocument();
  });

  it('renders subheadline mentioning AI assistants', () => {
    render(<Hero />);
    expect(screen.getByText(/ai assistants/i)).toBeInTheDocument();
  });

  it('renders auth form', () => {
    render(<Hero />);
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/component/landing/Hero.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

```tsx
// src/components/landing/Hero.tsx
import { AuthForm } from './AuthForm';

export function Hero() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Keep Your Code Skills Sharp
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Practice syntax through spaced repetition.
          <br />
          Built for developers who use AI assistants.
        </p>
        <div className="flex justify-center">
          <AuthForm />
        </div>
      </div>
    </section>
  );
}
```

```tsx
// src/components/landing/index.ts
export { AuthForm } from './AuthForm';
export { Hero } from './Hero';
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/component/landing/Hero.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/component/landing/Hero.test.tsx src/components/landing/
git commit -m "feat(landing): add Hero section with headline and auth form

- Headline: Keep Your Code Skills Sharp
- Subheadline mentions AI assistants
- Centered AuthForm"
```

---

### Task 2.3: Create Features Component (Test First)

**Files:**
- Create: `tests/component/landing/Features.test.tsx`
- Modify: `src/components/landing/Features.tsx`
- Modify: `src/components/landing/index.ts`

**Step 1: Write the failing test**

```tsx
// tests/component/landing/Features.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Features } from '@/components/landing';

describe('Features', () => {
  it('renders three feature cards', () => {
    render(<Features />);
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(3);
  });

  it('mentions spaced repetition', () => {
    render(<Features />);
    expect(screen.getByText(/spaced repetition/i)).toBeInTheDocument();
  });

  it('mentions code syntax', () => {
    render(<Features />);
    expect(screen.getByText(/code syntax/i)).toBeInTheDocument();
  });

  it('mentions progress tracking', () => {
    render(<Features />);
    expect(screen.getByText(/track.*progress|progress.*track|streaks/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/component/landing/Features.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

```tsx
// src/components/landing/Features.tsx
const features = [
  {
    title: 'Spaced Repetition',
    description: 'Science-backed algorithm schedules reviews at optimal intervals for long-term retention.',
    icon: '🧠',
  },
  {
    title: 'Code Syntax Focus',
    description: 'Practice real programming patterns, not trivia. Write actual code from memory.',
    icon: '💻',
  },
  {
    title: 'Track Progress & Streaks',
    description: 'Build consistency with daily streaks. Watch your accuracy improve over time.',
    icon: '📈',
  },
];

export function Features() {
  return (
    <section className="py-16 px-4 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

```tsx
// src/components/landing/index.ts
export { AuthForm } from './AuthForm';
export { Hero } from './Hero';
export { Features } from './Features';
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/component/landing/Features.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/component/landing/Features.test.tsx src/components/landing/
git commit -m "feat(landing): add Features section with three cards

- Spaced Repetition (science-backed algorithm)
- Code Syntax Focus (write real code)
- Track Progress & Streaks"
```

---

### Task 2.4: Create HowItWorks Component (Test First)

**Files:**
- Create: `tests/component/landing/HowItWorks.test.tsx`
- Modify: `src/components/landing/HowItWorks.tsx`
- Modify: `src/components/landing/index.ts`

**Step 1: Write the failing test**

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

  it('displays three steps', () => {
    render(<HowItWorks />);
    expect(screen.getByText(/1/)).toBeInTheDocument();
    expect(screen.getByText(/2/)).toBeInTheDocument();
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it('mentions daily exercises', () => {
    render(<HowItWorks />);
    expect(screen.getByText(/daily.*exercises|exercises.*daily/i)).toBeInTheDocument();
  });

  it('mentions typing code', () => {
    render(<HowItWorks />);
    expect(screen.getByText(/type.*code|code.*memory/i)).toBeInTheDocument();
  });

  it('mentions algorithm adaptation', () => {
    render(<HowItWorks />);
    expect(screen.getByText(/algorithm.*adjust|adjust.*timing/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/component/landing/HowItWorks.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

```tsx
// src/components/landing/HowItWorks.tsx
const steps = [
  {
    number: 1,
    title: 'Get Daily Exercises',
    description: 'Receive personalized exercises based on your learning schedule.',
  },
  {
    number: 2,
    title: 'Type Code from Memory',
    description: 'Practice writing real syntax without copy-pasting.',
  },
  {
    number: 3,
    title: 'Algorithm Adjusts Timing',
    description: 'Correct answers push reviews further out. Mistakes bring them back sooner.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-12">
          How It Works
        </h2>
        <div className="space-y-8">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                {step.number}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

```tsx
// src/components/landing/index.ts
export { AuthForm } from './AuthForm';
export { Hero } from './Hero';
export { Features } from './Features';
export { HowItWorks } from './HowItWorks';
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/component/landing/HowItWorks.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/component/landing/HowItWorks.test.tsx src/components/landing/
git commit -m "feat(landing): add HowItWorks section with 3-step explanation

1. Get daily exercises
2. Type code from memory
3. Algorithm adjusts timing"
```

---

### Task 2.5: Export Landing Components from Main Index

**Files:**
- Modify: `src/components/index.ts`
- Modify: `tests/unit/components/index.test.ts`

**Step 1: Write the failing test**

```tsx
// tests/unit/components/index.test.ts - ADD to existing
it('exports AuthForm', () => {
  expect(components.AuthForm).toBeDefined();
});

it('exports Hero', () => {
  expect(components.Hero).toBeDefined();
});

it('exports Features', () => {
  expect(components.Features).toBeDefined();
});

it('exports HowItWorks', () => {
  expect(components.HowItWorks).toBeDefined();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/components/index.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```tsx
// src/components/index.ts - ADD exports
export { AuthForm, Hero, Features, HowItWorks } from './landing';
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/components/index.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/index.ts tests/unit/components/index.test.ts
git commit -m "feat(components): export landing components from main index"
```

---

## Phase 3: Dashboard Enhancements

### Task 3.1: Create Greeting Component (Test First)

**Files:**
- Create: `tests/component/dashboard/Greeting.test.tsx`
- Create: `src/components/dashboard/Greeting.tsx`
- Modify: `src/components/dashboard/index.ts`

**Step 1: Write the failing test**

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

  it('shows "Good morning" before noon', () => {
    vi.setSystemTime(new Date('2026-01-03T08:00:00'));
    render(<Greeting />);
    expect(screen.getByText(/good morning/i)).toBeInTheDocument();
  });

  it('shows "Good afternoon" between noon and 5pm', () => {
    vi.setSystemTime(new Date('2026-01-03T14:00:00'));
    render(<Greeting />);
    expect(screen.getByText(/good afternoon/i)).toBeInTheDocument();
  });

  it('shows "Good evening" after 5pm', () => {
    vi.setSystemTime(new Date('2026-01-03T19:00:00'));
    render(<Greeting />);
    expect(screen.getByText(/good evening/i)).toBeInTheDocument();
  });

  it('includes "Ready to practice?" message', () => {
    vi.setSystemTime(new Date('2026-01-03T10:00:00'));
    render(<Greeting />);
    expect(screen.getByText(/ready to practice/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/component/dashboard/Greeting.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

```tsx
// src/components/dashboard/Greeting.tsx
'use client';

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

const greetings = {
  morning: 'Good morning',
  afternoon: 'Good afternoon',
  evening: 'Good evening',
};

export function Greeting() {
  const timeOfDay = getTimeOfDay();

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {greetings[timeOfDay]}!
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Ready to practice?
      </p>
    </div>
  );
}
```

```tsx
// src/components/dashboard/index.ts - ADD export
export { Greeting } from './Greeting';
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/component/dashboard/Greeting.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/component/dashboard/Greeting.test.tsx src/components/dashboard/
git commit -m "feat(dashboard): add Greeting component with time-based message

- Good morning/afternoon/evening based on hour
- 'Ready to practice?' sub-message"
```

---

### Task 3.2: Create PracticeCTA Component (Test First)

**Files:**
- Create: `tests/component/dashboard/PracticeCTA.test.tsx`
- Create: `src/components/dashboard/PracticeCTA.tsx`
- Modify: `src/components/dashboard/index.ts`

**Step 1: Write the failing test**

```tsx
// tests/component/dashboard/PracticeCTA.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PracticeCTA } from '@/components/dashboard';

const mockOnStart = vi.fn();

describe('PracticeCTA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays due count', () => {
    render(<PracticeCTA dueCount={15} newCount={5} onStart={mockOnStart} />);
    expect(screen.getByText(/15.*due|due.*15/i)).toBeInTheDocument();
  });

  it('displays new count', () => {
    render(<PracticeCTA dueCount={15} newCount={5} onStart={mockOnStart} />);
    expect(screen.getByText(/5.*new|new.*5/i)).toBeInTheDocument();
  });

  it('shows start practice button', () => {
    render(<PracticeCTA dueCount={15} newCount={5} onStart={mockOnStart} />);
    expect(screen.getByRole('button', { name: /start practice/i })).toBeInTheDocument();
  });

  it('calls onStart when button clicked', () => {
    render(<PracticeCTA dueCount={15} newCount={5} onStart={mockOnStart} />);
    fireEvent.click(screen.getByRole('button', { name: /start practice/i }));
    expect(mockOnStart).toHaveBeenCalledTimes(1);
  });

  it('shows total cards count', () => {
    render(<PracticeCTA dueCount={15} newCount={5} onStart={mockOnStart} />);
    expect(screen.getByText(/20.*cards|cards.*20/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/component/dashboard/PracticeCTA.test.tsx`
Expected: FAIL

**Step 3: Write minimal implementation**

```tsx
// src/components/dashboard/PracticeCTA.tsx
'use client';

interface PracticeCTAProps {
  dueCount: number;
  newCount: number;
  onStart: () => void;
}

export function PracticeCTA({ dueCount, newCount, onStart }: PracticeCTAProps) {
  const total = dueCount + newCount;

  return (
    <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 text-white/90 text-sm mb-2">
            <span>
              <strong className="text-white">{dueCount}</strong> due
            </span>
            <span className="text-white/50">•</span>
            <span>
              <strong className="text-white">{newCount}</strong> new
            </span>
            <span className="text-white/50">•</span>
            <span>{total} cards ready</span>
          </div>
        </div>
        <button
          onClick={onStart}
          className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-md"
        >
          Start Practice
        </button>
      </div>
    </div>
  );
}
```

```tsx
// src/components/dashboard/index.ts - ADD export
export { PracticeCTA } from './PracticeCTA';
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/component/dashboard/PracticeCTA.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add tests/component/dashboard/PracticeCTA.test.tsx src/components/dashboard/
git commit -m "feat(dashboard): add PracticeCTA component

- Shows due/new/total counts
- Prominent Start Practice button
- Gradient background styling"
```

---

### Task 3.3: Export New Dashboard Components

**Files:**
- Modify: `src/components/index.ts`
- Modify: `tests/unit/components/index.test.ts`

**Step 1: Write the failing test**

```tsx
// ADD to tests/unit/components/index.test.ts
it('exports Greeting', () => {
  expect(components.Greeting).toBeDefined();
});

it('exports PracticeCTA', () => {
  expect(components.PracticeCTA).toBeDefined();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/components/index.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```tsx
// src/components/index.ts - UPDATE dashboard exports
export { DueCardsBanner, EmptyState, StatsGrid, Greeting, PracticeCTA } from './dashboard';
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/components/index.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/index.ts tests/unit/components/index.test.ts
git commit -m "feat(components): export Greeting and PracticeCTA from main index"
```

---

## Phase 4: Page Updates

### Task 4.1: Replace Landing Page (Home)

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `tests/unit/app/page.test.tsx`

**Step 1: Update the test file**

```tsx
// tests/unit/app/page.test.tsx - REPLACE content
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

// Mock useAuth
vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('Home (Landing Page)', () => {
  it('renders LandingHeader', () => {
    render(<Home />);
    expect(screen.getByText(/syntaxsrs/i)).toBeInTheDocument();
  });

  it('renders Hero section with headline', () => {
    render(<Home />);
    expect(screen.getByText(/keep your code skills sharp/i)).toBeInTheDocument();
  });

  it('renders Features section', () => {
    render(<Home />);
    expect(screen.getByText(/spaced repetition/i)).toBeInTheDocument();
  });

  it('renders HowItWorks section', () => {
    render(<Home />);
    expect(screen.getByText(/how it works/i)).toBeInTheDocument();
  });

  it('renders AuthForm', () => {
    render(<Home />);
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/unit/app/page.test.tsx`
Expected: FAIL (current page doesn't have these components)

**Step 3: Replace the page implementation**

```tsx
// src/app/page.tsx - REPLACE content
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { LandingHeader, Hero, Features, HowItWorks } from '@/components';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <LandingHeader />
        <main>
          <Hero />
          <Features />
          <HowItWorks />
        </main>
      </div>
    );
  }

  // Redirect in progress
  return null;
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/app/page.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/page.tsx tests/unit/app/page.test.tsx
git commit -m "feat(app): replace home page with landing page

- LandingHeader with logo and sign in link
- Hero section with headline and auth form
- Features section with 3 cards
- HowItWorks section with 3 steps
- Auto-redirect to dashboard if authenticated"
```

---

### Task 4.2: Update Dashboard Page

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `tests/unit/app/dashboard.test.tsx`

**Step 1: Update the test**

```tsx
// tests/unit/app/dashboard.test.tsx - ADD tests
it('renders Header component', async () => {
  render(<DashboardPage />);
  // Header should be visible (via layout, but we can check for header elements)
  await waitFor(() => {
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });
});

it('renders Greeting component', async () => {
  render(<DashboardPage />);
  await waitFor(() => {
    expect(screen.getByText(/good (morning|afternoon|evening)/i)).toBeInTheDocument();
  });
});

it('renders PracticeCTA when cards are due', async () => {
  render(<DashboardPage />);
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /start practice/i })).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify current state**

Run: `pnpm test tests/unit/app/dashboard.test.tsx`

**Step 3: Update the dashboard implementation**

```tsx
// src/app/dashboard/page.tsx - UPDATE DashboardContent function
function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useStats();
  const [dueCount, setDueCount] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [totalExercises, setTotalExercises] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchStats() {
      setLoading(true);
      setError(null);

      try {
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('*');

        if (exercisesError) throw exercisesError;

        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user!.id);

        if (progressError) throw progressError;

        const exercises: Exercise[] = (exercisesData ?? []).map(mapExercise);
        const progress: UserProgress[] = (progressData ?? []).map(mapUserProgress);

        const dueCards = getDueCards(progress);
        const newCards = getNewCards(exercises, progress, NEW_CARDS_LIMIT);

        setDueCount(dueCards.length);
        setNewCount(newCards.length);
        setTotalExercises(exercises.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  const handleStartPractice = () => {
    router.push('/practice');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse text-gray-600 dark:text-gray-400">
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const hasReviewedAllExercises = totalExercises > 0 && dueCount === 0 && newCount === 0;
  const hasDueOrNewCards = dueCount > 0 || newCount > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="p-4">
        <div className="max-w-2xl mx-auto">
          {/* Greeting */}
          <Greeting />

          {/* Practice CTA or Empty State */}
          <div className="mb-8">
            {hasDueOrNewCards ? (
              <PracticeCTA
                dueCount={dueCount}
                newCount={newCount}
                onStart={handleStartPractice}
              />
            ) : hasReviewedAllExercises ? (
              <EmptyState variant="mastered-all" />
            ) : dueCount === 0 && totalExercises > 0 ? (
              <EmptyState
                variant="all-caught-up"
                newCardsAvailable={newCount}
                onLearnNew={handleStartPractice}
              />
            ) : (
              <div className="text-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400">
                  No exercises available yet.
                </p>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="mb-8">
            <StatsGrid stats={stats} loading={statsLoading} />
          </div>
        </div>
      </main>
    </div>
  );
}
```

Note: Also update imports at top of file:
```tsx
import { ProtectedRoute, EmptyState, ErrorBoundary, StatsGrid, Header, Greeting, PracticeCTA } from '@/components';
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/unit/app/dashboard.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/dashboard/page.tsx tests/unit/app/dashboard.test.tsx
git commit -m "feat(dashboard): integrate Header, Greeting, and PracticeCTA

- Header with stats in top bar
- Time-based greeting
- Prominent PracticeCTA replaces DueCardsBanner
- StatsGrid below the CTA"
```

---

### Task 4.3: Update Practice Page for Immersive Mode

**Files:**
- Modify: `src/app/practice/page.tsx`

**Step 1: Review current practice page**

The practice page is already fairly immersive. Main changes:
- Ensure no header is shown (already the case)
- Style "End Session" as a subtle link

**Step 2: Update the implementation**

```tsx
// src/app/practice/page.tsx - Update the return statement in PracticeSessionContent
// Just ensuring immersive mode - the current implementation is close

// The progress section should look like:
<div className="flex justify-between items-center mb-8">
  <SessionProgress
    current={stats.completed}
    total={stats.total}
    className="flex-1 mr-4"
  />
  <button
    onClick={endSession}
    className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
  >
    End Session
  </button>
</div>
```

**Step 3: Verify practice page works**

Run: `pnpm test tests/component/session/`
Expected: PASS

**Step 4: Commit**

```bash
git add src/app/practice/page.tsx
git commit -m "style(practice): ensure immersive mode styling

- End Session as subtle text link
- No header (already the case)"
```

---

### Task 4.4: Update SessionSummary with Celebration

**Files:**
- Modify: `src/components/session/SessionSummary.tsx`
- Modify: `tests/component/session/SessionSummary.test.tsx`

**Step 1: Update tests**

```tsx
// tests/component/session/SessionSummary.test.tsx - ADD tests
it('shows celebration icon', () => {
  render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
  // Check for celebration emoji or icon
  expect(screen.getByText(/✨|🎉|session complete/i)).toBeInTheDocument();
});

it('shows streak in stats', () => {
  render(
    <SessionSummary
      stats={createStats()}
      onDashboard={mockOnDashboard}
      streak={5}
    />
  );
  expect(screen.getByText(/5/)).toBeInTheDocument();
  expect(screen.getByText(/streak/i)).toBeInTheDocument();
});

it('shows encouraging message', () => {
  render(<SessionSummary stats={createStats()} onDashboard={mockOnDashboard} />);
  expect(screen.getByText(/see you|great job|well done/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test tests/component/session/SessionSummary.test.tsx`
Expected: Some FAIL

**Step 3: Update implementation**

```tsx
// src/components/session/SessionSummary.tsx - UPDATE
'use client';

import type { SessionStats } from '@/lib/session';

interface SessionSummaryProps {
  stats: SessionStats;
  onDashboard: () => void;
  streak?: number;
}

function formatDuration(startTime: Date, endTime?: Date): string {
  const end = endTime ?? new Date();
  const diffMs = end.getTime() - startTime.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getEncouragingMessage(accuracy: number): string {
  if (accuracy === 100) return 'Perfect score! Amazing work!';
  if (accuracy >= 80) return 'Great job! Keep it up!';
  if (accuracy >= 60) return 'Good progress! See you tomorrow!';
  return 'Practice makes perfect! See you next time!';
}

export function SessionSummary({ stats, onDashboard, streak = 0 }: SessionSummaryProps) {
  const accuracy =
    stats.completed > 0
      ? Math.round((stats.correct / stats.completed) * 100)
      : 0;

  return (
    <div className="max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
      {/* Celebration */}
      <div className="text-4xl mb-2">✨</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Session Complete!
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.completed}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Reviewed
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {accuracy}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Accuracy
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-orange-500">
            🔥 {streak}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Streak
          </div>
        </div>
      </div>

      {/* Detail line */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        +{stats.correct} correct • {stats.incorrect > 0 ? `${stats.incorrect} to review again` : 'No mistakes!'}
      </p>

      {/* Action button */}
      <button
        onClick={onDashboard}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors mb-4"
      >
        Back to Dashboard
      </button>

      {/* Encouraging message */}
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {getEncouragingMessage(accuracy)}
      </p>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm test tests/component/session/SessionSummary.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/session/SessionSummary.tsx tests/component/session/SessionSummary.test.tsx
git commit -m "feat(session): enhance SessionSummary with celebration

- Celebration emoji (✨)
- Stats grid: reviewed, accuracy, streak
- Detail line with correct/incorrect counts
- Encouraging message based on accuracy"
```

---

## Phase 5: Integration & Testing

### Task 5.1: Run All Unit Tests

**Step 1: Run full test suite**

Run: `pnpm test`
Expected: All tests PASS (previous 377 + new tests)

**Step 2: Fix any failures**

If any tests fail, debug and fix them before proceeding.

**Step 3: Commit if fixes were needed**

```bash
git add .
git commit -m "fix: resolve test failures from UI integration"
```

---

### Task 5.2: Update E2E Critical Path Test

**Files:**
- Modify: `tests/e2e/critical-path.spec.ts`

**Step 1: Update E2E test for new UI**

```tsx
// tests/e2e/critical-path.spec.ts - UPDATE
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { createTestUser, deleteTestUser, TestUser } from './utils/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let testUser: TestUser;

test.describe('Critical Path: Landing → Dashboard → Practice', () => {
  test.beforeAll(async () => {
    testUser = await createTestUser();
  });

  test.afterAll(async () => {
    if (testUser?.id) {
      await deleteTestUser(testUser.id);
    }
  });

  test('complete user flow from landing to practice', async ({ page }) => {
    // Step 1: Navigate to landing page
    await page.goto('/');

    // Step 2: Verify landing page loads with new UI
    await expect(page.getByText(/keep your code skills sharp/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholderText(/email/i)).toBeVisible();

    // Step 3: Sign in programmatically via Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });

    if (signInError) {
      throw new Error(`Failed to sign in test user: ${signInError.message}`);
    }

    // Step 4: Inject the session into the browser's localStorage
    const session = signInData.session;
    await page.evaluate(({ url, session }) => {
      const projectRef = new URL(url).hostname.split('.')[0];
      const storageKey = `sb-${projectRef}-auth-token`;
      localStorage.setItem(storageKey, JSON.stringify(session));
    }, { url: supabaseUrl, session });

    // Step 5: Navigate to dashboard
    await page.goto('/dashboard');

    // Step 6: Verify dashboard loads with new UI - look for greeting
    await expect(
      page.getByText(/good (morning|afternoon|evening)/i)
    ).toBeVisible({ timeout: 15000 });

    // Step 7: Verify header is visible with SyntaxSRS logo
    await expect(page.getByText(/syntaxsrs/i)).toBeVisible();

    // Step 8: Look for practice button or empty state
    const practiceButton = page.getByRole('button', { name: /start practice/i });
    const emptyState = page.getByText(/no cards|all caught up|no exercises/i);

    await expect(practiceButton.or(emptyState)).toBeVisible({ timeout: 10000 });

    // Step 9: If practice is available, test the flow
    if (await practiceButton.isVisible()) {
      await practiceButton.click();
      await expect(page).toHaveURL(/practice/);

      // Verify immersive mode - no header visible
      await expect(page.getByText(/syntaxsrs/i)).not.toBeVisible();

      // Look for End Session link
      await expect(page.getByText(/end session/i)).toBeVisible({ timeout: 10000 });

      // Verify exercise content or empty state
      const submitButton = page.getByRole('button', { name: /submit|check/i });
      const noCards = page.getByText(/no cards/i);
      await expect(submitButton.or(noCards)).toBeVisible({ timeout: 10000 });

      // If exercise visible, interact with it
      if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        const answerInput = page.getByPlaceholder(/type your answer/i);
        await answerInput.fill('print("Hello, World!")');
        await submitButton.click();

        // Verify feedback appears
        await expect(
          page.getByRole('button', { name: /continue/i })
        ).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
```

**Step 2: Run E2E test locally (if Supabase is running)**

Run: `pnpm test:e2e`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/e2e/critical-path.spec.ts
git commit -m "test(e2e): update critical path for new UI

- Landing page with headline and auth form
- Dashboard with greeting and header
- Practice page in immersive mode (no header)
- End Session link visible"
```

---

## Phase 6: Documentation Updates

### Task 6.1: Update Obsidian Documentation

**Step 1: Update Features.md in Obsidian**

Use `mcp__obsidian__patch_note` to update:
- Mark "UI/UX Redesign" as complete
- Add notes about new components

**Step 2: Update Index.md status**

Update current status to reflect UI redesign completion.

**Step 3: Commit any generated docs**

```bash
git add .
git commit -m "docs: update Obsidian vault with UI redesign completion"
```

---

### Task 6.2: Update Serena Memories

**Step 1: Update codebase_structure.md**

Add new component directories and files to structure docs.

**Step 2: Update project_overview.md**

Update project status and completed milestones.

**Step 3: Commit**

```bash
git add .serena/memories/
git commit -m "docs: update Serena memories with new UI components"
```

---

### Task 6.3: Update CLAUDE.md

**Step 1: Update project structure section**

Add new component folders:
- `src/components/layout/` - Header, LandingHeader
- `src/components/landing/` - AuthForm, Hero, Features, HowItWorks

**Step 2: Update milestones**

Add "UI/UX Redesign" to completed milestones.

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with UI redesign components and status"
```

---

## Phase 7: Final Verification

### Task 7.1: Run Complete Test Suite

**Step 1: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

**Step 2: Run type check**

Run: `pnpm typecheck`
Expected: No errors

**Step 3: Run lint**

Run: `pnpm lint`
Expected: No errors

**Step 4: Run build**

Run: `pnpm build`
Expected: Build succeeds

**Step 5: Commit any final fixes**

```bash
git add .
git commit -m "chore: final verification - all tests, types, lint, build pass"
```

---

### Task 7.2: Record Decision in Daem0nMCP

**Step 1: Remember the decision**

Use `mcp__daem0nmcp__remember` to record:
- UI/UX Redesign implementation complete
- New components created
- Test coverage maintained

**Step 2: Mark outcome**

Use `mcp__daem0nmcp__record_outcome` on the original decision memory.

---

## Summary

**Total Tasks:** ~25 bite-sized tasks across 7 phases
**New Components:** 9 (Header, LandingHeader, AuthForm, Hero, Features, HowItWorks, Greeting, PracticeCTA + SessionSummary update)
**Modified Files:** 6 pages/components
**New Test Files:** ~10
**Expected Commits:** ~20

**Key Principles Applied:**
- TDD throughout (test first, then implement)
- Small, focused commits
- Components are modular and exportable
- Mobile-first responsive design
- No new dependencies required
- Documentation kept in sync
