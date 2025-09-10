'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Mapea tonos para aplicar el mismo “look” que tus cards reales */
const toneMap = {
  cash: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/25 dark:border-emerald-900/60',
  bank: 'bg-sky-50 border-sky-200 dark:bg-sky-950/25 dark:border-sky-900/60',
  investment:
    'bg-violet-50 border-violet-200 dark:bg-violet-950/25 dark:border-violet-900/60',
  closed:
    'bg-slate-50 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800',
};

/* ===========================
   Header: sólo botones (título/hint reales)
   =========================== */
export function SavingAccountsHeaderButtonsSkeleton() {
  return (
    <div className='flex gap-2 flex-wrap'>
      <Skeleton
        className='h-9 w-56 rounded-md'
        tone='surface'
        variant='pulse-shimmer'
        speed='fast'
      />
      <Skeleton
        className='h-9 w-40 rounded-md'
        tone='surface'
        variant='pulse-shimmer'
        speed='fast'
      />
    </div>
  );
}

/* ===========================
   KPIs (4 tarjetas)
   =========================== */
export function SavingAccountsKpisSkeleton() {
  const CardKpi = ({
    variant,
  }: {
    variant: 'kpi-balance' | 'white' | 'kpi-green';
  }) => (
    <Card variant={variant} className='h-full'>
      <CardContent className='py-5 px-6'>
        <Skeleton
          className='h-4 w-40'
          tone='contrast'
          variant='pulse-shimmer'
        />
        <div className='mt-3 space-y-2'>
          {[0, 1, 2].map((i) => (
            <div key={i} className='flex items-center justify-between gap-3'>
              <Skeleton
                className='h-3 w-10 rounded'
                tone='contrast'
                variant='pulse-shimmer'
              />
              <Skeleton
                className='h-6 w-36 rounded'
                tone='contrast'
                variant='pulse-shimmer'
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <section
      className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
      aria-live='polite'
      role='status'
    >
      <CardKpi variant='kpi-balance' />
      <CardKpi variant='white' />
      <CardKpi variant='white' />
      <CardKpi variant='kpi-green' />
    </section>
  );
}

/* ===========================
   Tarjeta de cuenta (placeholder)
   =========================== */
function AccountCardSkeleton({
  tone,
}: {
  tone: 'cash' | 'bank' | 'investment' | 'closed';
}) {
  return (
    <Card
      variant='white'
      className={cn('p-4 border rounded-2xl', toneMap[tone])}
    >
      <div className='space-y-2'>
        <Skeleton
          className='h-4 w-2/3 rounded-md'
          tone='muted'
          variant='pulse-shimmer'
        />
        <Skeleton
          className='h-4 w-1/2 rounded-md'
          tone='muted'
          variant='pulse-shimmer'
        />
        <Skeleton
          className='h-3 w-24 rounded-full'
          tone='muted'
          variant='pulse-shimmer'
        />
      </div>

      <div className='mt-3 flex flex-wrap gap-2'>
        <Skeleton
          className='h-8 w-32 rounded-md'
          tone='muted'
          variant='pulse-shimmer'
        />
        <Skeleton
          className='h-8 w-28 rounded-md'
          tone='muted'
          variant='pulse-shimmer'
        />
        <Skeleton
          className='h-8 w-28 rounded-md'
          tone='muted'
          variant='pulse-shimmer'
        />
        {/* botón extra para investment (rendimiento) o acciones varias */}
        <Skeleton
          className='h-8 w-28 rounded-md'
          tone='muted'
          variant='pulse-shimmer'
        />
      </div>
    </Card>
  );
}

/* ===========================
   Sección por tipo (lista de cuentas)
   =========================== */
export function AccountsSectionSkeleton({
  tone,
  items = 4,
}: {
  tone: 'cash' | 'bank' | 'investment';
  items?: number;
}) {
  return (
    <section className='space-y-3' aria-live='polite' role='status'>
      {/* Mantén tu header real fuera; aquí sólo las cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
        {Array.from({ length: items }).map((_, i) => (
          <AccountCardSkeleton key={i} tone={tone} />
        ))}
      </div>
    </section>
  );
}

/* ===========================
   Sección de cerradas
   =========================== */
export function ClosedAccountsSkeleton({ items = 3 }: { items?: number }) {
  return (
    <section className='space-y-3' aria-live='polite' role='status'>
      <header className='flex items-center justify-between'>
        <div>
          <Skeleton
            className='h-4 w-40 rounded-md'
            tone='contrast'
            variant='pulse-shimmer'
          />
          <div className='mt-1'>
            <Skeleton
              className='h-3 w-64 rounded-md'
              tone='contrast'
              variant='pulse-shimmer'
            />
          </div>
        </div>
      </header>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
        {Array.from({ length: items }).map((_, i) => (
          <AccountCardSkeleton key={i} tone='closed' />
        ))}
      </div>
    </section>
  );
}
