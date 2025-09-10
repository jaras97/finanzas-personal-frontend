'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Tonos aproximados al look de DebtsSection */
const toneMap = {
  loan: 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50',
  credit:
    'bg-fuchsia-50 border-fuchsia-200 dark:bg-fuchsia-950/20 dark:border-fuchsia-900/50',
  closed:
    'bg-slate-50 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800',
};

/* ===========================
   Header: CTA
   =========================== */
export function DebtsHeaderCtaSkeleton() {
  return (
    <div className='flex gap-2 flex-wrap'>
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
   KPIs (3 tarjetas)
   =========================== */
export function DebtsKpisSkeleton() {
  const KpiCard = () => (
    <Card variant='white' className='h-full'>
      <CardContent className='py-5 px-6'>
        <Skeleton
          className='h-4 w-48'
          tone='contrast'
          variant='pulse-shimmer'
        />
        <div className='mt-3 space-y-2'>
          {[0, 1, 2].map((i) => (
            <div key={i} className='flex items-center justify-between gap-3'>
              <Skeleton
                className='h-3 w-12 rounded'
                tone='contrast'
                variant='pulse-shimmer'
              />
              <Skeleton
                className='h-6 w-40 rounded'
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
      className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
      aria-live='polite'
      role='status'
    >
      <KpiCard />
      <KpiCard />
      <KpiCard />
      {/* En xl hay 4 columnas; si quieres, duplica uno: */}
      <div className='hidden xl:block'>
        <KpiCard />
      </div>
    </section>
  );
}

/* ===========================
   Card de deuda (placeholder)
   =========================== */
function DebtCardSkeleton({
  tone,
  showExtraAction = true,
}: {
  tone: 'loan' | 'credit' | 'closed';
  showExtraAction?: boolean;
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
        <div className='flex items-center gap-2'>
          <Skeleton
            className='h-3 w-28 rounded-md'
            tone='muted'
            variant='pulse-shimmer'
          />
          <Skeleton
            className='h-3 w-24 rounded-md'
            tone='muted'
            variant='pulse-shimmer'
          />
        </div>
        <Skeleton
          className='h-3 w-20 rounded-full'
          tone='muted'
          variant='pulse-shimmer'
        />
      </div>

      <div className='mt-3 flex flex-wrap gap-2'>
        <Skeleton
          className='h-8 w-24 rounded-md'
          tone='muted'
          variant='pulse-shimmer'
        />
        <Skeleton
          className='h-8 w-28 rounded-md'
          tone='muted'
          variant='pulse-shimmer'
        />
        <Skeleton
          className='h-8 w-24 rounded-md'
          tone='muted'
          variant='pulse-shimmer'
        />
        {showExtraAction && (
          <Skeleton
            className='h-8 w-28 rounded-md'
            tone='muted'
            variant='pulse-shimmer'
          />
        )}
      </div>
    </Card>
  );
}

/* ===========================
   Sección por tipo (lista de deudas)
   =========================== */
export function DebtsSectionSkeleton({
  tone,
  items = 3,
  closed = false,
}: {
  tone: 'loan' | 'credit';
  items?: number;
  closed?: boolean;
}) {
  return (
    <section className='space-y-3' aria-live='polite' role='status'>
      {/* Header real fuera; aquí sólo las cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
        {Array.from({ length: items }).map((_, i) => (
          <DebtCardSkeleton
            key={i}
            tone={closed ? 'closed' : tone}
            showExtraAction={!closed}
          />
        ))}
      </div>
    </section>
  );
}
