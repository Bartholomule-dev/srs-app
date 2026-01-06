'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import { useToast } from '@/lib/context/ToastContext';
import type { ToastVariant } from '@/lib/context/toast.types';
import { cn } from '@/lib/utils';

const variantStyles: Record<ToastVariant, string> = {
  success: 'bg-green-900/90 border-green-500/30 text-green-100',
  error: 'bg-red-900/90 border-red-500/30 text-red-100',
  warning: 'bg-yellow-900/90 border-yellow-500/30 text-yellow-100',
  info: 'bg-blue-900/90 border-blue-500/30 text-blue-100',
};

const variantIcons: Record<ToastVariant, string> = {
  success: '\u2713',
  error: '\u2715',
  warning: '\u26A0',
  info: '\u2139',
};

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            role="alert"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className={cn(
              'pointer-events-auto min-w-[300px] max-w-[400px]',
              'rounded-lg border backdrop-blur-sm',
              'p-4 shadow-lg',
              variantStyles[toast.variant]
            )}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg" aria-hidden="true">
                {variantIcons[toast.variant]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{toast.title}</p>
                {toast.description && (
                  <p className="mt-1 text-sm opacity-80">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
                aria-label="Dismiss toast"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
