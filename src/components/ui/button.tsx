import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// Variantes alineadas a tu paleta + nuevas "soft-*"
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow hover:bg-destructive/90',
        outline:
          'border border-border bg-background shadow hover:bg-muted hover:text-foreground',
        secondary:
          'bg-secondary text-secondary-foreground shadow hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',

        // NEW: suaves/pastel para acciones secundarias
        'soft-sky':
          'border border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100',
        'soft-emerald':
          'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
        'soft-amber':
          'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100',
        'soft-rose':
          'border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100',
        'soft-fuchsia':
          'border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800 hover:bg-fuchsia-100',
        'soft-slate':
          'border border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 rounded-md',
        lg: 'h-10 px-6 rounded-md',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
