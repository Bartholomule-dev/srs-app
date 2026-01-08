'use client';

import { useProfile } from '@/lib/hooks/useProfile';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

interface GreetingProps {
  isLoading?: boolean;
}

export function Greeting({ isLoading = false }: GreetingProps) {
  const { profile, loading: profileLoading } = useProfile();

  const greeting = getGreeting();
  const username = profile?.username || 'there';
  const loading = isLoading || profileLoading;

  return (
    <div className="mb-2">
      <h1 className="text-2xl font-display font-bold text-[var(--text-primary)]">
        {greeting},{' '}
        <span className="text-[var(--text-primary)]">
          {loading ? '...' : username}
        </span>
      </h1>
    </div>
  );
}
