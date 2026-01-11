'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';

export function LandingHeader() {
  const scrollToAuthForm = () => {
    // Dispatch event to show auth form in Hero component
    window.dispatchEvent(new CustomEvent('showAuthForm'));

    // Wait for auth form to render, then focus
    setTimeout(() => {
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement | null;
      if (emailInput) {
        emailInput.focus();
        emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  return (
    <header
      className="sticky top-0 z-50 w-full
                       bg-[var(--bg-base)]/80 backdrop-blur-lg
                       border-b border-[var(--border)]"
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span
            className="text-xl font-display font-bold
                          bg-gradient-to-r from-[var(--accent-primary)] to-orange-500
                          bg-clip-text text-transparent
                          group-hover:scale-105 transition-transform duration-150"
          >
            SyntaxSRS
          </span>
        </Link>

        {/* Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                       transition-colors duration-150"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                       transition-colors duration-150"
          >
            How It Works
          </a>
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={scrollToAuthForm}>
            Sign In
          </Button>
          <Button size="sm" onClick={scrollToAuthForm}>
            Get Started
          </Button>
        </div>
      </nav>
    </header>
  );
}
