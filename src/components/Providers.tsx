'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/context/AuthContext';
import { ToastProvider } from '@/lib/context/ToastContext';
import { PyodideProvider } from '@/lib/context/PyodideContext';
import { ToastContainer } from '@/components/Toast';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ToastProvider>
        <PyodideProvider>
          {children}
        </PyodideProvider>
        <ToastContainer />
      </ToastProvider>
    </AuthProvider>
  );
}
