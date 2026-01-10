import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Fontsource variable fonts (loaded via CSS imports in layout)
vi.mock('@fontsource-variable/space-grotesk', () => ({}));
vi.mock('@fontsource-variable/dm-sans', () => ({}));
vi.mock('@fontsource-variable/jetbrains-mono', () => ({}));

// Mock Vercel analytics components
vi.mock('@vercel/speed-insights/next', () => ({
  SpeedInsights: () => null,
}));
vi.mock('@vercel/analytics/next', () => ({
  Analytics: () => null,
}));

// Mock toast context (for consistent mocking across test suite)
vi.mock('@/lib/context/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
    toasts: [],
    dismissToast: vi.fn(),
  }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => children,
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

  it('renders children within the layout structure', { timeout: 15000 }, async () => {
    // Dynamic import after mocks are set up
    // Note: This test can be slow when running in full suite due to module caching
    const { default: RootLayout } = await import('@/app/layout');

    // RootLayout returns an html element
    const layout = RootLayout({ children: <div data-testid="child">Test Child</div> });

    // Verify the structure
    expect(layout).toBeDefined();
    expect(layout.type).toBe('html');
    expect(layout.props.lang).toBe('en');
  });

  it('wraps children with Providers (AuthProvider + ToastProvider)', async () => {
    const { default: RootLayout } = await import('@/app/layout');

    const layout = RootLayout({ children: <div>Test Child</div> });

    // Get the body element
    const body = layout.props.children;
    expect(body).toBeDefined();
    expect(body.type).toBe('body');

    // The body contains multiple children: Providers, SpeedInsights, Analytics
    const children = body.props.children;
    expect(children).toBeDefined();

    // Find the Providers component (first child)
    const providers = Array.isArray(children) ? children[0] : children;
    expect(providers).toBeDefined();
    // Providers wraps AuthProvider and ToastProvider
    const providerName = providers.type.name || providers.type.displayName || providers.type;
    expect(providerName).toBe('Providers');
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
