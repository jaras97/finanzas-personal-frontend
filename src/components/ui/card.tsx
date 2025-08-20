// @/components/ui/card.tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

type CardVariant =
  | 'surface'
  | 'panel'
  | 'panel-strong'
  | 'panel-positive'
  | 'panel-negative'
  | 'panel-warning'
  | 'kpi-balance' // azul pastel (brand)
  | 'kpi-income' // verde pastel
  | 'kpi-expense' // rojo pastel
  | 'kpi-blue' // (si quieres mantener uno vivo, más suave)
  | 'kpi-green'
  | 'kpi-red'
  | 'plain'
  | 'white';

type CardProps = React.ComponentProps<'div'> & {
  variant?: CardVariant;
  /** Aumenta la sombra al hover */
  interactive?: boolean;
};

const base = 'relative flex flex-col gap-6 rounded-2xl';

const variantClasses: Record<CardVariant, string> = {
  // Superficies base
  surface: 'card-surface text-card-foreground py-6',
  panel: 'panel-muted text-card-foreground py-6',
  'panel-strong':
    'bg-[hsl(var(--accent))] text-card-foreground py-6 ' +
    'border border-[hsl(var(--border)/0.5)] rounded-2xl shadow-[0_8px_24px_-12px_rgba(2,6,23,.12)]',

  // Paneles semánticos (suaves)
  'panel-positive':
    'bg-gradient-to-br from-emerald-50 via-green-50 to-green-100 text-slate-900 ' +
    'border border-white/60 rounded-2xl shadow-[0_14px_40px_-16px_rgba(16,185,129,.18)] py-5',
  'panel-negative':
    'bg-gradient-to-br from-rose-50 via-red-50 to-red-100 text-slate-900 ' +
    'border border-white/60 rounded-2xl shadow-[0_14px_40px_-16px_rgba(239,68,68,.18)] py-5',
  'panel-warning':
    'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 text-slate-900 ' +
    'border border-white/60 rounded-2xl shadow-[0_14px_40px_-16px_rgba(245,158,11,.18)] py-5',

  // KPIs pastel (recomendadas para el dashboard)
  'kpi-balance':
    'bg-gradient-to-br from-sky-50 via-blue-100 to-blue-200 text-slate-900 ' +
    'border border-white/60 rounded-2xl shadow-[0_14px_40px_-12px_rgba(37,99,235,.22)] py-5',
  'kpi-income':
    'bg-gradient-to-br from-emerald-50 via-green-100 to-green-200 text-slate-900 ' +
    'border border-white/60 rounded-2xl shadow-[0_14px_40px_-12px_rgba(16,185,129,.22)] py-5',
  'kpi-expense':
    'bg-gradient-to-br from-rose-50 via-red-100 to-red-200 text-slate-900 ' +
    'border border-white/60 rounded-2xl shadow-[0_14px_40px_-12px_rgba(239,68,68,.22)] py-5',

  // KPIs vivos (suavizados respecto a los tuyos anteriores)
  'kpi-blue':
    'bg-gradient-to-br from-blue-500/90 via-sky-400/85 to-sky-500/90 text-white ' +
    'border border-white/15 rounded-2xl shadow-[0_16px_48px_-24px_rgba(37,99,235,.45)] py-5',
  'kpi-green':
    'bg-gradient-to-br from-emerald-500/90 via-emerald-400/85 to-green-600/90 text-white ' +
    'border border-white/15 rounded-2xl shadow-[0_16px_48px_-24px_rgba(16,185,129,.4)] py-5',
  'kpi-red':
    'bg-gradient-to-br from-rose-500/90 via-rose-400/85 to-red-600/90 text-white ' +
    'border border-white/15 rounded-2xl shadow-[0_16px_48px_-24px_rgba(239,68,68,.4)] py-5',

  // Plano
  plain: 'bg-transparent text-card-foreground',
  white:
    'bg-white text-slate-900 py-6 ' +
    'border border-[hsl(var(--border)/0.5)] rounded-2xl shadow-[0_8px_24px_-12px_rgba(2,6,23,.12)]',
};

const interactiveCls =
  'transition-shadow hover:shadow-[0_18px_56px_-24px_rgba(2,6,23,.25)]';

function Card({
  className,
  variant = 'surface',
  interactive = false,
  ...props
}: CardProps) {
  return (
    <div
      data-slot='card'
      className={cn(
        base,
        variantClasses[variant],
        interactive && interactiveCls,
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-header'
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-title'
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-description'
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-action'
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-content'
      className={cn('px-6', className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-footer'
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
