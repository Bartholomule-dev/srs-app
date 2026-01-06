'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function KeyboardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <line x1="6" y1="10" x2="6" y2="10" strokeLinecap="round" />
      <line x1="10" y1="10" x2="10" y2="10" strokeLinecap="round" />
      <line x1="14" y1="10" x2="14" y2="10" strokeLinecap="round" />
      <line x1="18" y1="10" x2="18" y2="10" strokeLinecap="round" />
      <line x1="8" y1="14" x2="16" y2="14" />
    </svg>
  );
}

function BrainIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 2a5 5 0 0 1 5 5c0 2-1 3-2 4s-1 2-1 3v6a2 2 0 0 1-4 0v-6c0-1 0-2-1-3s-2-2-2-4a5 5 0 0 1 5-5z" />
    </svg>
  );
}

const steps = [
  {
    number: 1,
    title: 'Get Daily Exercises',
    description: 'Personalized practice based on your schedule and progress.',
    Icon: CalendarIcon,
  },
  {
    number: 2,
    title: 'Type From Memory',
    description: 'Write actual code syntax without peeking at references.',
    Icon: KeyboardIcon,
  },
  {
    number: 3,
    title: 'Algorithm Adapts',
    description: 'Smart scheduling adjusts based on your accuracy.',
    Icon: BrainIcon,
  },
];

export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  return (
    <section id="how-it-works" ref={sectionRef} className="py-24 px-4 bg-[var(--bg-base)]">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold tracking-[-0.02em] mb-4">
            How It Works
          </h2>
          <p className="text-[var(--text-secondary)] text-lg">
            Three simple steps to keep your syntax sharp
          </p>
        </motion.div>

        {/* Steps container */}
        <div className="relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-16 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5">
            <motion.div
              className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-orange-500"
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              style={{ originX: 0 }}
            />
          </div>

          {/* Steps grid */}
          <div className="grid md:grid-cols-3 gap-8 md:gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                className="relative flex flex-col items-center text-center"
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.15 }}
              >
                {/* Number badge with glow */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-[var(--accent-primary)] rounded-full blur-lg opacity-30" />
                  <div
                    className="relative w-12 h-12 rounded-full bg-[var(--accent-primary)]
                                  flex items-center justify-center text-white font-bold text-lg
                                  shadow-lg"
                  >
                    {step.number}
                  </div>
                </div>

                {/* Icon */}
                <step.Icon className="w-8 h-8 text-[var(--text-secondary)] mb-4" />

                {/* Content */}
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm max-w-[200px]">
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
