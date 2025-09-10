'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function SummarySkeleton() {
  return (
    <div className='space-y-6' aria-live='polite' role='status'>
      {/* 1) KPIs */}
      <section className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} variant='kpi-balance' interactive>
            <CardContent className='py-5 px-6 space-y-2'>
              <Skeleton className='h-4 w-36' variant='pulse-shimmer' />
              <Skeleton className='h-7 w-28' variant='pulse-shimmer' />
            </CardContent>
          </Card>
        ))}
      </section>

      {/* 2) Totales (superficie blanca) */}
      <section className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} variant='kpi-income'>
            <CardContent className='p-5 space-y-2'>
              <Skeleton className='h-4 w-40' />
              <Skeleton className='h-7 w-32' />
            </CardContent>
          </Card>
        ))}
      </section>

      {/* 3) Flujo de caja (paneles semánticos) */}
      <section className='grid grid-cols-1 sm:grid-cols-4 gap-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} variant='panel-warning'>
            <CardContent className='p-5 space-y-2'>
              <Skeleton className='h-4 w-44' />
              <Skeleton className='h-7 w-28' />
            </CardContent>
          </Card>
        ))}
      </section>

      {/* 4) Gráficas */}
      <section className='space-y-4'>
        {/* Área ingresos/egresos */}
        <Card variant='surface'>
          <CardContent className='p-4'>
            <Skeleton className='h-48 w-full rounded-lg' variant='shimmer' />
            {/* Líneas bajo el gráfico para imitar leyenda/ejes */}
            <div className='mt-3 grid grid-cols-3 gap-2'>
              <Skeleton className='h-3 w-full' />
              <Skeleton className='h-3 w-full' />
              <Skeleton className='h-3 w-full' />
            </div>
          </CardContent>
        </Card>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {/* Donut gastos */}
          <Card variant='surface'>
            <CardContent className='p-4 space-y-4'>
              <Skeleton className='h-5 w-60' />
              <div className='grid grid-cols-[auto,1fr] gap-4 items-center'>
                <div className='mx-auto'>
                  <Skeleton className='h-40 w-40 rounded-full' />
                </div>
                <div className='space-y-2'>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className='h-3 w-full' />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Donut ingresos */}
          <Card variant='surface'>
            <CardContent className='p-4 space-y-4'>
              <Skeleton className='h-5 w-64' />
              <div className='grid grid-cols-[auto,1fr] gap-4 items-center'>
                <div className='mx-auto'>
                  <Skeleton className='h-40 w-40 rounded-full' />
                </div>
                <div className='space-y-2'>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className='h-3 w-full' />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerta (si aplica) */}
        <div className='p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30'>
          <Skeleton className='h-5 w-80 mx-auto' />
        </div>
      </section>
    </div>
  );
}
