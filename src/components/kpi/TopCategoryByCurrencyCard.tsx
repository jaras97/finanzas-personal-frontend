// components/kpi/TopCategoryByCurrencyCard.tsx
'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { currencyType } from '@/types';

const currencyOrder: currencyType[] = ['COP', 'USD', 'EUR'];

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
  const keys = (only ?? (Object.keys(data) as currencyType[])).filter(
    (c) => data[c] !== undefined,
  );

  const preferred = prefer
    .filter((c) => keys.includes(c))
    .map((c) => [c, data[c]!] as const);

  const extras = keys
    .filter((c) => !prefer.includes(c))
    .sort((a, b) => currencyOrder.indexOf(a) - currencyOrder.indexOf(b))
    .map((c) => [c, data[c]!] as const);

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

  return (
    <Card
      variant={cardVariant}
      className={cn(gradient && 'kpi-gradient-strong', className)}
    >
      <CardContent className={cn('py-5 px-6', contentClassName)}>
        <p className={cn('text-sm/5', titleClassName ?? defaultTitleClass)}>
          {title}
        </p>
        <RowsTopCategory
          data={data}
          prefer={prefer}
          only={only}
          className='mt-2'
          formatter={formatter}
        />
      </CardContent>
    </Card>
  );
}
