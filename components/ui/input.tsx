import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-14 w-full rounded-2xl border border-border bg-white px-4 text-[17px] font-medium tracking-tight text-foreground',
          'placeholder:text-muted-foreground/80',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors duration-150',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
