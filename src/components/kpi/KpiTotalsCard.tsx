'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { currencyType } from '@/types';

const currencyOrder: currencyType[] = ['COP', 'USD', 'EUR'];

type CardVariant = NonNullable<React.ComponentProps<typeof Card>['variant']>;

export type KpiTotalsCardProps = {
  title: string;
  totals: Record<currencyType, number>;
  /** Monedas preferidas en orden (las demás caerán como "extras") */
  prefer?: currencyType[];
  /** Pasa directamente la variante del <Card> (surface | white | kpi-green | …) */
  cardVariant?: CardVariant;
  /** Si quieres el gradiente fuerte (usa tu clase global kpi-gradient-strong) */
  gradient?: boolean;
  /** Fuerza color del título (útil si el fondo es oscuro) */
  titleClassName?: string;

  className?: string;
  contentClassName?: string;
  currencyFormatter?: (value: number, currency: currencyType) => string;
};

export function TotalsRows({
  totals,
  prefer = ['COP', 'USD'],
  className,
  currencyFormatter = (v, c) => `${formatCurrency(v)} ${c}`,
}: {
  totals: Record<currencyType, number>;
  prefer?: currencyType[];
  className?: string;
  currencyFormatter?: (value: number, currency: currencyType) => string;
}) {
  const preferred = prefer.map((c) => [c, totals[c] || 0] as const);
  const extras = (Object.entries(totals) as Array<[currencyType, number]>)
    .filter(([c]) => !prefer.includes(c))
    .sort((a, b) => currencyOrder.indexOf(a[0]) - currencyOrder.indexOf(b[0]));

  return (
    <div className={cn('mt-2 space-y-1.5', className)}>
      {preferred.map(([c, v]) => (
        <div key={c} className='flex items-center justify-between text-sm/5'>
          <span className='opacity-85'>{c}</span>
          <span className='font-semibold'>{currencyFormatter(v, c)}</span>
        </div>
      ))}
      {extras.map(([c, v]) => (
        <div
          key={c}
          className='flex items-center justify-between text-xs/5 opacity-90'
        >
          <span>{c}</span>
          <span className='font-medium'>{currencyFormatter(v, c)}</span>
        </div>
      ))}
    </div>
  );
}

export default function KpiTotalsCard({
  title,
  totals,
  prefer = ['COP', 'USD'],
  cardVariant = 'surface',
  gradient = false,
  titleClassName,
  className,
  contentClassName,
  currencyFormatter,
}: KpiTotalsCardProps) {
  // Si usas el gradiente, el título suele ir claro
  const defaultTitleClass = gradient
    ? 'text-white/85'
    : 'text-muted-foreground';

  return (
    <Card
      variant={cardVariant}
      className={cn(gradient && 'kpi-gradient-strong', className)}
    >
      <CardContent className={cn('py-5 px-6', contentClassName)}>
        <p className={cn('text-sm/5', titleClassName ?? defaultTitleClass)}>
          {title}
        </p>
        <TotalsRows
          totals={totals}
          prefer={prefer}
          currencyFormatter={currencyFormatter}
          className='mt-2'
        />
      </CardContent>
    </Card>
  );
}
