'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, Button } from '@/components/ui';

const features = [
  {
    title: 'Spaced Repetition',
    description:
      'Science-backed algorithm schedules reviews at optimal intervals for long-term retention.',
    icon: BrainIcon,
  },
  {
    title: 'Code Syntax Focus',
    description: 'Practice real programming patterns. Write actual code from memory.',
    icon: CodeIcon,
  },
  {
    title: 'Track Progress',
    description: 'Build consistency with daily streaks. Watch your accuracy improve over time.',
    icon: ChartIcon,
  },
];

function BrainIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
      <path d="M12 6c-2.5 0-4 1.5-4 3.5 0 1.5.5 2.5 2 3.5-1.5 1-2 2-2 3.5 0 2 1.5 3.5 4 3.5s4-1.5 4-3.5c0-1.5-.5-2.5-2-3.5 1.5-1 2-2 2-3.5 0-2-1.5-3.5-4-3.5z" />
    </svg>
  );
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}

export function Features() {
  const scrollToAuthForm = () => {
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement | null;
    if (emailInput) {
      emailInput.focus();
      emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <section id="features" className="py-24 px-4 bg-[var(--bg-surface-1)]">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold tracking-[-0.02em] mb-4">Why SyntaxSRS?</h2>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
            Built specifically for developers who want to maintain their syntax fluency.
          </p>
        </motion.div>

        {/* Asymmetric Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {/* Hero Card - Spaced Repetition (spans 4 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
            className="md:col-span-4"
          >
            <Card elevation={2} interactive className="h-full">
              <CardContent className="p-8 h-full flex flex-col">
                <BrainIcon className="w-12 h-12 text-[var(--accent-primary)] mb-6" />
                <h3 className="text-2xl font-semibold mb-3">{features[0].title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed text-lg">
                  {features[0].description}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* CTA Card (spans 2 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2"
          >
            <Card
              elevation={2}
              className="h-full bg-gradient-to-br from-[var(--accent-primary)]/10 to-orange-500/10"
            >
              <CardContent className="p-8 h-full flex flex-col justify-center items-center text-center">
                <p className="text-lg font-medium mb-4">Ready to start?</p>
                <Button glow onClick={scrollToAuthForm}>
                  Try Free
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Code Syntax Focus (spans 3 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="md:col-span-3"
          >
            <Card elevation={2} interactive className="h-full">
              <CardContent className="p-8 h-full flex flex-col">
                <CodeIcon className="w-10 h-10 text-[var(--accent-primary)] mb-6" />
                <h3 className="text-xl font-semibold mb-3">{features[1].title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {features[1].description}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Track Progress (spans 3 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="md:col-span-3"
          >
            <Card elevation={2} interactive className="h-full">
              <CardContent className="p-8 h-full flex flex-col">
                <ChartIcon className="w-10 h-10 text-[var(--accent-primary)] mb-6" />
                <h3 className="text-xl font-semibold mb-3">{features[2].title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {features[2].description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
