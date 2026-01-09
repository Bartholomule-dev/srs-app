'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  cloneElement,
  isValidElement,
  type ReactNode,
  type HTMLAttributes,
  type ReactElement,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const DEFAULT_DELAY = 200;

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  delayDuration: number;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

// Provider context for global delay configuration
const TooltipConfigContext = createContext<{ delayDuration: number }>({
  delayDuration: DEFAULT_DELAY,
});

function useTooltipContext() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('Tooltip components must be used within a Tooltip');
  }
  return context;
}

export interface TooltipProviderProps {
  children: ReactNode;
  /** Default delay before showing tooltips (ms). Defaults to 200. */
  delayDuration?: number;
}

export function TooltipProvider({ children, delayDuration = DEFAULT_DELAY }: TooltipProviderProps) {
  return (
    <TooltipConfigContext.Provider value={{ delayDuration }}>
      {children}
    </TooltipConfigContext.Provider>
  );
}

export interface TooltipProps {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Tooltip({ children, open: controlledOpen, defaultOpen = false, onOpenChange }: TooltipProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const { delayDuration } = useContext(TooltipConfigContext);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = useCallback(
    (value: boolean) => {
      setUncontrolledOpen(value);
      onOpenChange?.(value);
    },
    [onOpenChange]
  );

  return (
    <TooltipContext.Provider value={{ open, setOpen, delayDuration }}>
      <div className="relative inline-block">{children}</div>
    </TooltipContext.Provider>
  );
}

export interface TooltipTriggerProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  /** Render as child element instead of wrapping in span */
  asChild?: boolean;
}

export function TooltipTrigger({
  children,
  className,
  asChild = false,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onClick,
  onTouchStart,
  ...props
}: TooltipTriggerProps & {
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  onTouchStart?: (e: React.TouchEvent<HTMLElement>) => void;
}) {
  const { open, setOpen, delayDuration } = useTooltipContext();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isTouchRef = useRef(false);

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    // Skip hover on touch devices
    if (isTouchRef.current) return;
    timeoutRef.current = setTimeout(() => setOpen(true), delayDuration);
    // Call consumer's handler if provided (merge, don't override)
    onMouseEnter?.(e as React.MouseEvent<HTMLSpanElement>);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(false);
    onMouseLeave?.(e as React.MouseEvent<HTMLSpanElement>);
  };

  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    setOpen(true);
    onFocus?.(e as React.FocusEvent<HTMLSpanElement>);
  };

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    setOpen(false);
    onBlur?.(e as React.FocusEvent<HTMLSpanElement>);
  };

  // Touch support: tap to toggle tooltip
  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    isTouchRef.current = true;
    onTouchStart?.(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    // On touch devices, toggle tooltip on tap
    if (isTouchRef.current) {
      e.preventDefault();
      setOpen(!open);
    }
    onClick?.(e);
  };

  const triggerProps = {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onTouchStart: handleTouchStart,
    onClick: handleClick,
    ...props,
  };

  // asChild: clone the child element and inject props
  if (asChild && isValidElement(children)) {
    // eslint-disable-next-line react-hooks/refs -- false positive: no ref passed to cloneElement
    return cloneElement(children as ReactElement<Record<string, unknown>>, {
      ...triggerProps,
      className: cn((children.props as { className?: string }).className, className),
    });
  }

  // Default: wrap in span
  return (
    <span className={cn('cursor-default', className)} {...triggerProps}>
      {children}
    </span>
  );
}

export interface TooltipContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
}

const positionClasses: Record<string, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2',
  bottom: 'top-full left-1/2 -translate-x-1/2',
  left: 'right-full top-1/2 -translate-y-1/2',
  right: 'left-full top-1/2 -translate-y-1/2',
};

function getOffsetStyle(side: string, offset: number): React.CSSProperties {
  switch (side) {
    case 'top': return { marginBottom: offset };
    case 'bottom': return { marginTop: offset };
    case 'left': return { marginRight: offset };
    case 'right': return { marginLeft: offset };
    default: return {};
  }
}

export function TooltipContent({
  children,
  className,
  side = 'top',
  sideOffset = 8,
  style,
  id,
  'aria-label': ariaLabel,
}: TooltipContentProps) {
  const { open } = useTooltipContext();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="tooltip"
          id={id}
          aria-label={ariaLabel}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          style={{ ...getOffsetStyle(side, sideOffset), ...style }}
          className={cn(
            'absolute z-50 px-3 py-1.5',
            'rounded-md shadow-lg',
            'bg-[var(--bg-surface-3)] text-[var(--text-primary)]',
            'text-sm whitespace-nowrap',
            'border border-[var(--border)]',
            positionClasses[side],
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
