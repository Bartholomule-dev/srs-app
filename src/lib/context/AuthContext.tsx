'use client';

import { createContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AuthContextValue, AuthState } from './auth.types';

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    supabase.auth.getUser()
      .then(({ data, error }) => {
        setState({
          user: data.user,
          loading: false,
          error: error,
        });
      })
      .catch((error) => {
        setState({
          user: null,
          loading: false,
          error: error instanceof Error ? error : new Error('Failed to fetch user'),
        });
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState((prev) => ({
          ...prev,
          user: session?.user ?? null,
          loading: false,
        }));
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      },
    });

    setState((prev) => ({
      ...prev,
      loading: false,
      error: error,
    }));

    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const { error } = await supabase.auth.signOut();

    setState({
      user: null,
      loading: false,
      error: error,
    });

    if (error) throw error;
  }, []);

  const value: AuthContextValue = {
    ...state,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
