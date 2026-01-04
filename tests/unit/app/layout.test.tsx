import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';

// Mock Fontsource variable fonts (loaded via CSS imports in layout)
vi.mock('@fontsource-variable/space-grotesk', () => ({}));
vi.mock('@fontsource-variable/dm-sans', () => ({}));
vi.mock('@fontsource-variable/jetbrains-mono', () => ({}));

// Mock darwin-ui ToastProvider
vi.mock('@pikoloo/darwin-ui', () => ({
  ToastProvider: ({ children }: { children: ReactNode }) => children,
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

describe('RootLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children within the layout structure', async () => {
    // Dynamic import after mocks are set up
    const { default: RootLayout } = await import('@/app/layout');

    // RootLayout returns an html element
    const layout = RootLayout({ children: <div data-testid="child">Test Child</div> });

    // Verify the structure
    expect(layout).toBeDefined();
    expect(layout.type).toBe('html');
    expect(layout.props.lang).toBe('en');
  });

  it('wraps children with AuthProvider', async () => {
    const { default: RootLayout } = await import('@/app/layout');

    const layout = RootLayout({ children: <div>Test Child</div> });

    // Get the body element
    const body = layout.props.children;
    expect(body).toBeDefined();
    expect(body.type).toBe('body');

    // The body should contain AuthProvider which wraps children
    // AuthProvider is a function component, so we check it exists
    const authProvider = body.props.children;
    expect(authProvider).toBeDefined();
    // AuthProvider's displayName or name should indicate it's the auth provider
    expect(authProvider.type.name || authProvider.type.displayName || authProvider.type).toBe('AuthProvider');
  });

  it('includes proper font classes on body', async () => {
    const { default: RootLayout } = await import('@/app/layout');

    const layout = RootLayout({ children: <div>Test</div> });
    const body = layout.props.children;

    // New theme uses font-body (DM Sans) from Tailwind CSS 4 theme config
    expect(body.props.className).toContain('font-body');
    expect(body.props.className).toContain('antialiased');
  });
});
