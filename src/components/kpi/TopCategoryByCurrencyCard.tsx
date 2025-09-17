// components/kpi/TopCategoryByCurrencyCard.tsx
'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { currencyType } from '@/types';

const currencyOrder: currencyType[] = ['COP', 'USD'];

type CardVariant = NonNullable<React.ComponentProps<typeof Card>['variant']>;

export type TopByCurrency = Record<
  currencyType,
  { name: string; total: number } | undefined
>;

export function RowsTopCategory({
  data,
  prefer = ['COP', 'USD'] as currencyType[],
  only,
  className,
  formatter = (v: number, c: currencyType) => `${formatCurrency(v)} ${c}`,
}: {
  data: TopByCurrency;
  prefer?: currencyType[];
  /** Limita la visualización sólo a estas monedas */
  only?: currencyType[];
  className?: string;
  formatter?: (value: number, currency: currencyType) => string;
}) {
  // 🔁 Monedas a mostrar: si viene `only`, úsalo tal cual (aunque no haya datos).
  // Si no, usa las presentes en data.
  const displayKeys = only ?? (Object.keys(data) as currencyType[]);

  const preferred = prefer
    .filter((c) => displayKeys.includes(c))
    .map((c) => [c, data[c]] as const);

  const extras = displayKeys
    .filter((c) => !prefer.includes(c))
    .sort((a, b) => currencyOrder.indexOf(a) - currencyOrder.indexOf(b))
    .map((c) => [c, data[c]] as const);

  const Row = ({
    c,
    item,
    dense = false,
  }: {
    c: currencyType;
    item: { name: string; total: number } | undefined;
    dense?: boolean;
  }) => (
    <div
      className={cn(
        'flex items-center justify-between',
        dense ? 'text-xs/5 opacity-90' : 'text-sm/5',
      )}
    >
      <span className='truncate pr-2'>
        {c} — <b>{item?.name ?? '—'}</b>
      </span>
      <span className={dense ? 'font-medium' : 'font-semibold'}>
        {formatter(item?.total ?? 0, c)}
      </span>
    </div>
  );

  return (
    <div className={cn('mt-2 space-y-1.5', className)}>
      {preferred.map(([c, item]) => (
        <Row key={c} c={c} item={item} />
      ))}
      {extras.map(([c, item]) => (
        <Row key={c} c={c} item={item} dense />
      ))}
    </div>
  );
}

export default function TopCategoryByCurrencyCard({
  title,
  data,
  cardVariant = 'surface',
  gradient = false,
  titleClassName,
  className,
  contentClassName,
  prefer,
  only,
  formatter,
}: {
  title: string;
  data: TopByCurrency;
  cardVariant?: CardVariant;
  gradient?: boolean;
  titleClassName?: string;
  className?: string;
  contentClassName?: string;
  prefer?: currencyType[];
  /** Limita la visualización sólo a estas monedas */
  only?: currencyType[];
  formatter?: (value: number, currency: currencyType) => string;
}) {
  const defaultTitleClass = gradient
    ? 'text-white/85'
    : 'text-muted-foreground';

  // 🧠 Detecta si no hay datos útiles para las monedas a mostrar
  const currenciesToCheck = only ?? (Object.keys(data) as currencyType[]);
  const isEmpty =
    currenciesToCheck.length === 0 ||
    currenciesToCheck.every((c) => {
      const v = data[c];
      return !v || (v.total ?? 0) <= 0;
    });

  return (
    <Card
      variant={cardVariant}
      className={cn(gradient && 'kpi-gradient-strong', className)}
    >
      <CardContent className={cn('py-5 px-6', contentClassName)}>
        <p className={cn('text-sm/5', titleClassName ?? defaultTitleClass)}>
          {title}
        </p>

        {isEmpty ? (
          // 🎯 Empty-state compacto para KPI
          <div
            role='status'
            aria-live='polite'
            className='mt-2 rounded-lg 
                        text-[hsl(var(--muted-foreground))]
                       px-3 py-2 text-xs'
          >
            <div className='font-medium text-[hsl(var(--foreground))]'>
              Sin datos en este período
            </div>
            <div className='mt-0.5'>
              Registra transacciones o ajusta el rango de fechas.
            </div>
          </div>
        ) : (
          <RowsTopCategory
            data={data}
            prefer={prefer}
            only={only}
            className='mt-2'
            formatter={formatter}
          />
        )}
      </CardContent>
    </Card>
  );
}
