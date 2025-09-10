'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/* ===========================
   KPIs (encima de la tabla)
   =========================== */
export function TransactionsKpisSkeleton() {
  return (
    <section
      className='grid grid-cols-1 sm:grid-cols-3 gap-4'
      aria-live='polite'
      role='status'
    >
      {/* Ingresos */}
      <Card variant='kpi-income' interactive>
        <CardContent className='py-5 px-6'>
          <Skeleton
            className='h-4 w-36'
            tone='contrast'
            variant='pulse-shimmer'
          />
          <div className='mt-2 space-y-1.5'>
            {[0, 1].map((i) => (
              <div key={i} className='flex items-center justify-between'>
                <Skeleton className='h-3 w-8 rounded' tone='contrast' />
                <Skeleton className='h-6 w-40 rounded' tone='contrast' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gastos */}
      <Card variant='kpi-expense' interactive>
        <CardContent className='py-5 px-6'>
          <Skeleton
            className='h-4 w-32'
            tone='contrast'
            variant='pulse-shimmer'
          />
          <div className='mt-2 space-y-1.5'>
            {[0, 1].map((i) => (
              <div key={i} className='flex items-center justify-between'>
                <Skeleton className='h-3 w-8 rounded' tone='contrast' />
                <Skeleton className='h-6 w-40 rounded' tone='contrast' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Neto */}
      <Card variant='kpi-balance' interactive>
        <CardContent className='py-5 px-6'>
          <Skeleton
            className='h-4 w-28'
            tone='contrast'
            variant='pulse-shimmer'
          />
          <div className='mt-2 space-y-1.5'>
            {[0, 1].map((i) => (
              <div key={i} className='flex items-center justify-between'>
                <Skeleton className='h-3 w-8 rounded' tone='contrast' />
                <Skeleton className='h-6 w-40 rounded' tone='contrast' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

/* ===========================
   Desktop: Toolbar + Tabla (refactor)
   =========================== */
export function TransactionsDesktopSkeleton() {
  return (
    <Card
      variant='white'
      className='hidden md:block'
      aria-live='polite'
      role='status'
    >
      {/* Toolbar */}
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-4 py-3'>
        <div className='flex items-center gap-2'>
          <Skeleton
            className='h-9 w-28 rounded-lg'
            tone='surface'
            variant='pulse-shimmer'
            speed='fast'
          />
          <Skeleton
            className='h-9 w-28 rounded-lg'
            tone='surface'
            variant='pulse-shimmer'
            speed='fast'
          />
          <div className='relative'>
            <Skeleton
              className='h-9 w-[240px] rounded-lg'
              tone='surface'
              variant='pulse-shimmer'
              speed='fast'
            />
          </div>
        </div>
        <Skeleton
          className='h-9 w-40 rounded-lg'
          tone='surface'
          variant='pulse-shimmer'
          speed='fast'
        />
      </div>

      <CardContent className='p-0'>
        <div className='px-4 pb-4'>
          {/* Header de tabla sin borde, con chips */}
          <div className='grid grid-cols-12 gap-3 py-2'>
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                className='h-3 w-24 rounded-full'
                tone='contrast'
                variant='pulse-shimmer'
              />
            ))}
            {/* Acciones */}
            <div className='flex items-center justify-end'>
              <Skeleton
                className='h-3 w-16 rounded-full'
                tone='contrast'
                variant='pulse-shimmer'
              />
            </div>
          </div>

          {/* Filas como cajas (sin divide-y) */}
          <div className='space-y-2.5'>
            {[...Array(8)].map((_, r) => (
              <div
                key={r}
                className='rounded-xl px-3 py-3'
                style={{
                  background: 'hsl(var(--muted) / 0.55)',
                }}
              >
                <div className='grid grid-cols-12 gap-3 items-center'>
                  {/* Col 1: descripción (larga) */}
                  <Skeleton
                    className='h-4 w-full rounded-md'
                    tone='muted'
                    variant='pulse-shimmer'
                  />
                  {/* Col 2: fecha */}
                  <Skeleton
                    className='h-4 w-24 rounded-md col-span-2 md:col-span-2'
                    tone='muted'
                    variant='pulse-shimmer'
                  />
                  {/* Col 3: categoría */}
                  <Skeleton
                    className='h-4 w-28 rounded-md col-span-2 md:col-span-2'
                    tone='muted'
                    variant='pulse-shimmer'
                  />
                  {/* Col 4: cuenta/origen */}
                  <Skeleton
                    className='h-4 w-32 rounded-md col-span-3 md:col-span-3'
                    tone='muted'
                    variant='pulse-shimmer'
                  />
                  {/* Col 5: monto */}
                  <Skeleton
                    className='h-4 w-20 rounded-md col-span-2 md:col-span-2'
                    tone='muted'
                    variant='pulse-shimmer'
                  />

                  {/* Acciones */}
                  <div className='col-span-12 md:col-span-2 flex md:justify-end gap-2 mt-2 md:mt-0'>
                    <Skeleton
                      className='h-8 w-16 rounded-md'
                      tone='muted'
                      variant='pulse-shimmer'
                    />
                    <Skeleton
                      className='h-8 w-20 rounded-md'
                      tone='muted'
                      variant='pulse-shimmer'
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      {/* Paginación (pastillas suaves) */}
      <div className='px-4 py-3 flex items-center justify-center gap-2'>
        {[...Array(5)].map((_, i) => (
          <Skeleton
            key={i}
            className='h-8 w-8 rounded-md'
            tone='contrast'
            variant='pulse-shimmer'
            speed='slow'
          />
        ))}
      </div>
    </Card>
  );
}

/* ===========================
   Mobile: Toolbar + Lista (refactor)
   =========================== */
export function TransactionsMobileSkeleton() {
  return (
    <div className='md:hidden' aria-live='polite' role='status'>
      {/* Toolbar mobile */}
      <div className='px-2 pt-1 flex flex-wrap items-center gap-2'>
        <Skeleton
          className='h-8 w-24 rounded-md'
          tone='surface'
          variant='pulse-shimmer'
          speed='fast'
        />
        <Skeleton
          className='h-8 w-10 rounded-md'
          tone='surface'
          variant='pulse-shimmer'
          speed='fast'
        />
        <Skeleton
          className='h-9 w-full rounded-md'
          tone='surface'
          variant='pulse-shimmer'
          speed='fast'
        />
        <div className='ml-auto'>
          <Skeleton
            className='h-8 w-36 rounded-md'
            tone='surface'
            variant='pulse-shimmer'
            speed='fast'
          />
        </div>
      </div>

      {/* Lista de cards (cajas por item) */}
      <div className='space-y-2 mt-2 px-2'>
        {[...Array(6)].map((_, i) => (
          <Card key={i} variant='white'>
            <CardContent className='p-4'>
              {/* Caja del título + fecha */}
              <div
                className='rounded-xl p-3'
                style={{ background: 'hsl(var(--muted) / 0.55)' }}
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='flex-1 min-w-0'>
                    <Skeleton
                      className='h-4 w-3/5 rounded-md'
                      tone='muted'
                      variant='pulse-shimmer'
                    />
                    <div className='mt-1'>
                      <Skeleton
                        className='h-3 w-24 rounded-md'
                        tone='muted'
                        variant='pulse-shimmer'
                      />
                    </div>
                  </div>
                  <Skeleton
                    className='h-5 w-28 rounded-md'
                    tone='muted'
                    variant='pulse-shimmer'
                  />
                </div>

                <div className='mt-2 flex flex-wrap gap-1'>
                  <Skeleton
                    className='h-5 w-20 rounded-full'
                    tone='muted'
                    variant='pulse-shimmer'
                  />
                  <Skeleton
                    className='h-5 w-28 rounded-full'
                    tone='muted'
                    variant='pulse-shimmer'
                  />
                </div>

                <div className='mt-2 grid grid-cols-2 gap-2'>
                  <Skeleton
                    className='h-3 w-full rounded-md'
                    tone='muted'
                    variant='pulse-shimmer'
                  />
                  <Skeleton
                    className='h-3 w-full rounded-md'
                    tone='muted'
                    variant='pulse-shimmer'
                  />
                </div>

                <div className='mt-3 flex gap-2 justify-end'>
                  <Skeleton
                    className='h-8 w-16 rounded-md'
                    tone='muted'
                    variant='pulse-shimmer'
                  />
                  <Skeleton
                    className='h-8 w-16 rounded-md'
                    tone='muted'
                    variant='pulse-shimmer'
                  />
                  <Skeleton
                    className='h-8 w-20 rounded-md'
                    tone='muted'
                    variant='pulse-shimmer'
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Paginación mobile */}
      <div className='mt-3 pt-3 px-2 flex items-center justify-center gap-2'>
        {[...Array(4)].map((_, i) => (
          <Skeleton
            key={i}
            className='h-8 w-8 rounded-md'
            tone='contrast'
            variant='pulse-shimmer'
            speed='slow'
          />
        ))}
      </div>
    </div>
  );
}
