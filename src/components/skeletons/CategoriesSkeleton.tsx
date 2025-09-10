'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/* ===========================
   Header: Filtros + CTA
   =========================== */
export function CategoriesHeaderSkeleton() {
  return (
    <div className='flex flex-col sm:flex-row gap-3 sm:items-center w-full md:w-auto'>
      {/* DateRangePicker */}
      <div className='w-full sm:w-[min(420px,100%)]'>
        <Skeleton
          className='h-10 w-full rounded-lg'
          tone='surface'
          variant='pulse-shimmer'
          speed='fast'
        />
      </div>
      {/* Botón */}
      <div className='flex gap-2'>
        <Skeleton
          className='h-10 w-40 rounded-md'
          tone='surface'
          variant='pulse-shimmer'
          speed='fast'
        />
      </div>
    </div>
  );
}

/* ===========================
   KPIs: Top categoría por moneda (2 cards)
   =========================== */
export function CategoriesKpisSkeleton() {
  const KpiCard = ({ variant }: { variant: 'kpi-expense' | 'kpi-income' }) => (
    <Card variant={variant}>
      <CardContent className='py-5 px-6'>
        {/* Título */}
        <Skeleton
          className='h-4 w-56'
          tone='contrast'
          variant='pulse-shimmer'
        />
        {/* Lista de monedas (COP / USD placeholders) */}
        <div className='mt-3 space-y-2'>
          {[0, 1].map((i) => (
            <div key={i} className='flex items-center justify-between gap-4'>
              <Skeleton
                className='h-5 w-14 rounded-full'
                tone='contrast'
                variant='pulse-shimmer'
              />
              <div className='flex-1 mx-3'>
                <Skeleton
                  className='h-3 w-full rounded-md'
                  tone='contrast'
                  variant='pulse-shimmer'
                />
              </div>
              <Skeleton
                className='h-6 w-40 rounded-md'
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
      className='grid grid-cols-1 sm:grid-cols-2 gap-4'
      aria-live='polite'
      role='status'
    >
      <KpiCard variant='kpi-expense' />
      <KpiCard variant='kpi-income' />
    </section>
  );
}

/* ===========================
   Item de categoría (card)
   =========================== */
function CategoryCardSkeleton({ inactive = false }: { inactive?: boolean }) {
  return (
    <Card
      variant='white'
      className={cn(
        'p-4 flex flex-col md:flex-row md:justify-between md:items-center',
        inactive && 'border-dashed',
      )}
    >
      <div className='min-w-0'>
        <Skeleton
          className='h-4 w-48 rounded-md'
          tone='muted'
          variant='pulse-shimmer'
        />
        <div className='flex gap-2 mt-2 flex-wrap'>
          {/* Tipo */}
          <Skeleton
            className='h-6 w-20 rounded-full'
            tone='muted'
            variant='pulse-shimmer'
          />
          {/* Estado */}
          <Skeleton
            className='h-6 w-16 rounded-full'
            tone='muted'
            variant='pulse-shimmer'
          />
          {/* Sistema (opcional) */}
          <Skeleton
            className='h-6 w-20 rounded-full'
            tone='muted'
            variant='pulse-shimmer'
          />
        </div>
      </div>

      <div className='mt-3 md:mt-0 flex gap-2 flex-wrap'>
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
      </div>
    </Card>
  );
}

/* ===========================
   Lista de categorías (activas/inactivas)
   =========================== */
export function CategoriesListSkeleton({
  inactive = false,
  items = 6,
}: {
  inactive?: boolean;
  items?: number;
}) {
  return (
    <section className='space-y-2' aria-live='polite' role='status'>
      {Array.from({ length: items }).map((_, i) => (
        <CategoryCardSkeleton key={i} inactive={inactive} />
      ))}
    </section>
  );
}
