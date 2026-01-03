'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { LandingHeader, Hero, Features, HowItWorks } from '@/components';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (user) {
    // Redirect is happening, show nothing
    return null;
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      <LandingHeader />
      <Hero />
      <Features />
      <HowItWorks />
    </main>
  );
}
