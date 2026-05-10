'use client';

import { useRipple } from './useRipple';
import { cn } from '@/lib/utils';

/**
 * Button with ripple micro-interaction.
 * Wraps native button — just add className and children.
 */
export default function RippleButton({
  children,
  className,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ripple = useRipple();

  return (
    <button
      {...props}
      onClick={(e) => {
        ripple(e);
        onClick?.(e);
      }}
      className={cn('ripple-container relative overflow-hidden active:scale-[0.97] transition-transform', className)}
    >
      {children}
    </button>
  );
}
