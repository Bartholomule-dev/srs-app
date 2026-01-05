// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ProtectedRoute,
  ErrorBoundary,
  Header,
  Greeting,
  StatsGrid,
} from '@/components';
import { useAuth, useStats } from '@/lib/hooks';
import { supabase } from '@/lib/supabase/client';
import { mapUserProgress } from '@/lib/supabase/mappers';
import { getDueCards } from '@/lib/srs';
import type { UserProgress } from '@/lib/types';

function DashboardBackground() {
  return (
    <>
      {/* Aurora gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[var(--bg-base)] via-[#1a1a2e] to-[#0f1419] -z-10" />

      {/* Spotlight effect from top-right */}
      <div
        className="fixed top-0 right-0 w-[600px] h-[600px] -z-10
                      bg-[radial-gradient(circle,rgba(59,130,246,0.12)_0%,transparent_70%)]"
      />

      {/* Secondary glow from bottom-left */}
      <div
        className="fixed bottom-0 left-0 w-[500px] h-[500px] -z-10
                      bg-[radial-gradient(circle,rgba(139,92,246,0.08)_0%,transparent_70%)]"
      />

      {/* Accent glow following user focus area */}
      <div
        className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] -z-10
                      bg-[radial-gradient(ellipse,rgba(34,197,94,0.05)_0%,transparent_70%)]"
      />

      {/* Grain texture overlay */}
      <div className="fixed inset-0 opacity-20 bg-[url('/noise.svg')] pointer-events-none -z-10" />
    </>
  );
}

function LoadingSkeleton() {
  return (
    <>
      <Header />
      <DashboardBackground />
      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Greeting skeleton */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)]/50 backdrop-blur-sm p-6 md:p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-[var(--bg-surface-3)] rounded-lg w-64" />
              <div className="h-5 bg-[var(--bg-surface-3)] rounded-lg w-48" />
              <div className="flex gap-3 pt-2">
                <div className="h-12 bg-[var(--bg-surface-3)] rounded-lg w-36" />
              </div>
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface-1)]/50 backdrop-blur-sm p-6"
              >
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-[var(--bg-surface-3)] rounded w-20" />
                  <div className="h-8 bg-[var(--bg-surface-3)] rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const { stats, loading: statsLoading } = useStats();
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchStats() {
      setLoading(true);
      setError(null);

      try {
        // Fetch user progress
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', user!.id);

        if (progressError) throw progressError;

        const progress: UserProgress[] = (progressData ?? []).map(mapUserProgress);

        const dueCards = getDueCards(progress);

        setDueCount(dueCards.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <>
        <Header />
        <DashboardBackground />
        <main className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            className="text-center py-12 rounded-xl border border-red-500/20 bg-red-500/5 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </motion.div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <DashboardBackground />
      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Animated Greeting */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Greeting dueCount={dueCount} isLoading={loading} />
          </motion.div>

          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex items-center justify-between"
          >
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              Your Progress
            </h2>
          </motion.div>

          {/* Animated Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <StatsGrid stats={stats} loading={statsLoading} />
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <QuickActionCard
              title="Daily Goal"
              description="Complete your practice to maintain your streak"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              accentColor="var(--accent-success)"
              progress={dueCount > 0 ? 0 : 100}
            />
            <QuickActionCard
              title="Learning Path"
              description="50 Python exercises available"
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              }
              accentColor="var(--accent-primary)"
            />
          </motion.div>
        </div>
      </main>
    </>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  progress?: number;
}

function QuickActionCard({ title, description, icon, accentColor, progress }: QuickActionCardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-[var(--border)]
                 bg-[var(--bg-surface-1)]/50 backdrop-blur-sm p-6
                 hover:border-[var(--border-hover)] hover:bg-[var(--bg-surface-2)]/50
                 transition-all duration-200 group cursor-pointer"
    >
      {/* Accent glow on hover */}
      <div
        className="absolute -top-12 -right-12 w-24 h-24 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle, ${accentColor}, transparent 70%)` }}
      />

      <div className="relative flex items-start gap-4">
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)` }}
        >
          <div style={{ color: accentColor }}>{icon}</div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
          <p className="text-sm text-[var(--text-secondary)]">{description}</p>
          {progress !== undefined && (
            <div className="mt-3">
              <div className="h-1.5 bg-[var(--bg-surface-3)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: accentColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute redirectTo="/">
      <ErrorBoundary
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
            <p className="text-[var(--text-secondary)]">Something went wrong. Please refresh the page.</p>
          </div>
        }
      >
        <DashboardContent />
      </ErrorBoundary>
    </ProtectedRoute>
  );
}
