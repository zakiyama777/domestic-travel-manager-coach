import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold tracking-[0.02em]',
  {
    variants: {
      variant: {
        default: 'bg-muted text-foreground/70',
        primary: 'bg-primary/10 text-primary',
        accent: 'bg-accent/10 text-accent',
        warning: 'bg-warning/10 text-warning',
        outline: 'border border-border bg-white text-foreground/60',
        law: 'bg-[hsl(var(--subject-law)/0.1)] text-[hsl(var(--subject-law))]',
        terms: 'bg-[hsl(var(--subject-terms)/0.1)] text-[hsl(var(--subject-terms))]',
        practice: 'bg-[hsl(var(--subject-practice)/0.1)] text-[hsl(var(--subject-practice))]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
