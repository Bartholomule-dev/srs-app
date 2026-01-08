/**
 * Global test setup
 *
 * SAFETY: These tests are designed for LOCAL Supabase only.
 * The default keys are local Supabase demo keys that won't work on real projects.
 */
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import React from 'react';

// Mock framer-motion to render immediately without animations
// This is necessary because jsdom doesn't support animations and motion.div
// renders with opacity:0 by default during the animation phase
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();

  // Props to strip from motion components (framer-motion specific)
  const MOTION_PROPS = new Set([
    'initial', 'animate', 'exit', 'transition', 'variants',
    'whileHover', 'whileTap', 'whileInView', 'whileFocus', 'whileDrag',
    'layout', 'layoutId', 'drag', 'dragConstraints', 'dragElastic',
    'dragMomentum', 'onDragStart', 'onDrag', 'onDragEnd',
    'onAnimationStart', 'onAnimationComplete', 'viewport',
  ]);

  // Create a component that strips animation props and renders as regular element
  const createMotionComponent = (tag: keyof React.JSX.IntrinsicElements) => {
    const Component = React.forwardRef<HTMLElement, Record<string, unknown> & { children?: React.ReactNode }>(
      ({ children, style, ...allProps }, ref) => {
        // Filter out motion-specific props
        const props = Object.fromEntries(
          Object.entries(allProps).filter(([key]) => !MOTION_PROPS.has(key))
        );
        // Filter out any remaining motion-specific style properties
        const cleanStyle = style && typeof style === 'object'
          ? Object.fromEntries(
              Object.entries(style as Record<string, unknown>).filter(
                ([key]) => !key.startsWith('--motion')
              )
            )
          : style;
        return React.createElement(tag, { ...props, style: cleanStyle, ref }, children as React.ReactNode);
      }
    );
    Component.displayName = `motion.${tag}`;
    return Component;
  };

  // Cache for motion components to ensure stable references
  const componentCache = new Map<string, ReturnType<typeof createMotionComponent>>();

  // Proxy to create motion.div, motion.span, etc on demand
  const motion = new Proxy(
    // Base object with common properties that framer-motion's motion has
    {
      // Provide custom method that some libraries use
      custom: (Component: React.ComponentType) => Component,
    } as Record<string, unknown>,
    {
      get: (target, prop) => {
        // Handle Symbol properties (like Symbol.toStringTag)
        if (typeof prop === 'symbol') {
          return undefined;
        }

        // Check if it's a base property
        if (prop in target) {
          return target[prop];
        }

        // Check cache first
        if (componentCache.has(prop)) {
          return componentCache.get(prop);
        }

        // Create and cache the component
        const component = createMotionComponent(prop as keyof React.JSX.IntrinsicElements);
        componentCache.set(prop, component);
        return component;
      },
    }
  );

  return {
    ...actual,
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useSpring: (initialValue: number) => ({
      get: () => initialValue,
      set: () => {},
      on: () => () => {},
    }),
    useTransform: (_value: unknown, transform: (v: number) => number) => ({
      get: () => transform(0),
      on: (_event: string, callback: (v: number) => void) => {
        callback(transform(0));
        return () => {};
      },
    }),
    useAnimation: () => ({
      start: () => Promise.resolve(),
      stop: () => {},
      set: () => {},
    }),
    useMotionValue: (initial: number) => ({
      get: () => initial,
      set: () => {},
      on: () => () => {},
    }),
    useInView: () => true,
  };
});

// Mock IntersectionObserver for framer-motion's whileInView feature
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

// Mock ResizeObserver for components that use it (e.g., SkillTree dependency lines)
class MockResizeObserver implements ResizeObserver {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(callback: ResizeObserverCallback) {}

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

vi.stubGlobal('ResizeObserver', MockResizeObserver);

// Warn if tests might be running against a real Supabase project
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
if (supabaseUrl && !supabaseUrl.includes('127.0.0.1') && !supabaseUrl.includes('localhost')) {
  console.warn(
    '\n⚠️  WARNING: NEXT_PUBLIC_SUPABASE_URL points to a remote host.\n' +
    '   Integration tests are designed for local Supabase only.\n' +
    '   Set SKIP_INTEGRATION_TESTS=true to skip them, or use local Supabase.\n'
  );
  if (process.env.SKIP_INTEGRATION_TESTS !== 'true') {
    throw new Error('Refusing to run integration tests against remote Supabase. Set SKIP_INTEGRATION_TESTS=true to skip.');
  }
}

// Local Supabase demo keys (safe defaults)
export const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321';
export const LOCAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
export const LOCAL_SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
