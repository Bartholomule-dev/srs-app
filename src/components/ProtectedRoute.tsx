'use client';

import { type ReactNode } from 'react';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  loadingComponent?: ReactNode;
}

export function ProtectedRoute({
  children,
  redirectTo,
  loadingComponent,
}: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useRequireAuth({ redirectTo });

  if (loading) {
    return loadingComponent ?? <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect is happening via useRequireAuth, don't render anything
    return null;
  }

  return <>{children}</>;
}
