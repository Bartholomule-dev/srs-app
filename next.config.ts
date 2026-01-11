import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// Security headers configuration
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  // HSTS - only enable in production (Vercel handles this, but explicit is better)
  ...(process.env.NODE_ENV === 'production'
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains',
        },
      ]
    : []),
  // CSP - permissive for Pyodide (WebAssembly) and inline styles (Framer Motion)
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: self + Pyodide CDN + unsafe-eval for Pyodide Python execution + Vercel analytics
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://va.vercel-scripts.com",
      // Styles: self + unsafe-inline for Framer Motion and Tailwind
      "style-src 'self' 'unsafe-inline'",
      // Images: self + data URIs + Supabase storage
      "img-src 'self' data: blob: https://*.supabase.co",
      // Fonts: self
      "font-src 'self'",
      // Connect: self + Supabase APIs + Pyodide CDN + Vercel analytics
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.jsdelivr.net https://va.vercel-scripts.com https://vitals.vercel-insights.com",
      // WebAssembly for Pyodide
      "script-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://va.vercel-scripts.com",
      // Workers for potential future Pyodide isolation
      "worker-src 'self' blob:",
      // Frame ancestors - prevent clickjacking
      "frame-ancestors 'none'",
      // Form action
      "form-action 'self'",
      // Base URI
      "base-uri 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
