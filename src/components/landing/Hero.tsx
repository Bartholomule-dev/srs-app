'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DURATION, EASE } from '@/lib/motion';
import { Button } from '@/components/ui';
import { AuthForm } from './AuthForm';

export function Hero() {
  const [showAuthForm, setShowAuthForm] = useState(false);

  const scrollToFeatures = useCallback(() => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Aurora gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-base)] via-[#1a1710] to-[#14120a]" />

      {/* Spotlight effect from top-right */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px]
                      bg-[radial-gradient(circle,rgba(245,158,11,0.15)_0%,transparent_70%)]"
      />

      {/* Secondary glow from bottom-left */}
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px]
                      bg-[radial-gradient(circle,rgba(249,115,22,0.1)_0%,transparent_70%)]"
      />

      {/* Grain texture overlay */}
      <div className="absolute inset-0 opacity-20 bg-[url('/noise.svg')] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          {/* Left column - 3/5 */}
          <motion.div
            className="lg:col-span-3 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.page }}
          >
            {/* Badge */}
            <motion.span
              className="inline-block px-4 py-1.5 rounded-full text-sm
                         bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]
                         border border-[var(--accent-primary)]/20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              For developers who use AI assistants
            </motion.span>

            {/* Headline with gradient */}
            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-display font-bold
                          tracking-tight leading-[1.1]"
            >
              Keep Your{' '}
              <span
                className="bg-gradient-to-r from-[var(--accent-primary)] to-orange-500
                              bg-clip-text text-transparent"
              >
                Code Sharp
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-xl">
              Practice syntax through spaced repetition.
              <br />
              <span className="text-[var(--text-tertiary)]">5 minutes a day to stay fluent.</span>
            </p>

            {/* CTA buttons or Auth Form */}
            <div className="flex flex-wrap gap-4 pt-4">
              <AnimatePresence mode="wait">
                {showAuthForm ? (
                  <motion.div
                    key="auth-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-sm"
                  >
                    <AuthForm />
                    <button
                      onClick={() => setShowAuthForm(false)}
                      className="mt-3 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                      Back to options
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="cta-buttons"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-wrap gap-4"
                  >
                    <Button glow size="lg" onClick={() => setShowAuthForm(true)}>
                      Start Free
                    </Button>
                    <Button variant="ghost" size="lg" onClick={scrollToFeatures}>
                      See how it works
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right column - Code mockup 2/5 */}
          <motion.div
            className="lg:col-span-2 relative hidden lg:block"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: DURATION.page, delay: 0.3 }}
          >
            <CodeMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CodeMockup() {
  const [displayedCode, setDisplayedCode] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isTyping, setIsTyping] = useState(true);
  const targetCode = 'print("Hello, World!")';

  useEffect(() => {
    let index = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const typeNextChar = () => {
      if (index <= targetCode.length) {
        setDisplayedCode(targetCode.slice(0, index));
        index++;
        timeoutId = setTimeout(typeNextChar, 80 + Math.random() * 40);
      } else {
        setIsTyping(false);
        timeoutId = setTimeout(() => setShowSuccess(true), 400);
      }
    };

    // Start typing after a short delay
    timeoutId = setTimeout(typeNextChar, 800);

    return () => clearTimeout(timeoutId);
  }, []);

  // Parse the code for syntax highlighting
  const renderCode = () => {
    if (!displayedCode) return null;

    // Match print function and string content
    const printMatch = displayedCode.match(/^(print)(\()?(\"[^"]*\"?)?(\))?$/);

    if (printMatch) {
      const [, func, openParen, str, closeParen] = printMatch;
      return (
        <>
          <span className="text-[var(--syntax-function)]">{func}</span>
          {openParen && <span className="text-[var(--text-primary)]">{openParen}</span>}
          {str && <span className="text-[var(--syntax-string)]">{str}</span>}
          {closeParen && <span className="text-[var(--text-primary)]">{closeParen}</span>}
        </>
      );
    }

    return <span className="text-[var(--text-primary)]">{displayedCode}</span>;
  };

  return (
    <div className="relative">
      {/* Glow behind card */}
      <div className="absolute -inset-4 bg-[var(--accent-primary)]/10 rounded-2xl blur-xl" />

      <div
        className="relative bg-[var(--bg-surface-2)] rounded-xl
                      border border-[var(--border)] shadow-2xl overflow-hidden"
      >
        {/* Editor header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-surface-1)]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-[var(--text-tertiary)] text-sm ml-2">exercise.py</span>
        </div>

        {/* Code area */}
        <div className="p-6 font-mono text-lg min-h-[120px]">
          <div className="flex gap-4">
            <span className="text-[var(--text-tertiary)] select-none">1</span>
            <span>
              {renderCode()}
              {isTyping && (
                <span className="inline-block w-[2px] h-[1.2em] bg-[var(--accent-primary)] ml-[1px] animate-pulse align-middle" />
              )}
            </span>
          </div>
        </div>

        {/* Success overlay */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center
                         bg-[var(--accent-success)]/10 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: DURATION.normal, ease: EASE.emphasized }}
                className="w-16 h-16 rounded-full bg-[var(--accent-success)]
                           flex items-center justify-center shadow-lg"
              >
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating badge */}
      <motion.div
        className="absolute -bottom-4 -right-4 px-3 py-1.5 rounded-lg
                   bg-[var(--bg-surface-3)] border border-[var(--border)]
                   text-sm text-[var(--text-secondary)] shadow-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5 }}
      >
        <span className="text-[var(--accent-success)]">+10 XP</span> Correct!
      </motion.div>
    </div>
  );
}
