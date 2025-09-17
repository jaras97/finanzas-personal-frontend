'use client';
import React, { useMemo, useId } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { EmptyState } from '../ui/EmptyState';

type Row = { date: string; income: number; expense: number };

type Props = {
  data: Row[];
  title?: string;
  /** Ej: 'es-CO' */
  locale?: string;
  /** Ej: 'COP' para mostrar moneda; si omites, muestra miles sin símbolo */
  currency?: string;
};

export function AreaIncomeExpense({
  data,
  title = 'Ingresos vs Gastos',
  locale = 'es-CO',
  currency,
}: Props) {
  const totalIncome = useMemo(
    () => data.reduce((a, r) => a + (r.income || 0), 0),
    [data],
  );
  const totalExpense = useMemo(
    () => data.reduce((a, r) => a + (r.expense || 0), 0),
    [data],
  );

  const hasValues = useMemo(
    () =>
      (data?.length ?? 0) > 0 &&
      data.some((d) => (d.income ?? 0) !== 0 || (d.expense ?? 0) !== 0),
    [data],
  );

  const formatNumber = (n: number) => {
    if (currency) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(n || 0);
    }
    return new Intl.NumberFormat(locale).format(n || 0);
  };

  const formatDateTick = (s: string) => {
    // Si viene YYYY-MM-DD -> "dd/MM" (compacto)
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const [y, m, d] = s.split('-').map(Number);
      return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
    }
    // fallback: devuelve tal cual
    return s;
  };

  // ids únicos para gradientes, evita colisiones si hay varios charts
  const gradIncId = useId().replaceAll(':', '_') + '_inc';
  const gradExpId = useId().replaceAll(':', '_') + '_exp';

  return (
    <div className='chart-surface p-4'>
      <div className='flex items-center justify-between gap-2'>
        <h3 className='text-sm font-medium'>{title}</h3>

        {/* Leyenda compacta */}
        {hasValues && (
          <div className='hidden md:flex items-center gap-3 text-xs'>
            <LegendDot
              color='hsl(var(--color-chart-2))'
              label={`Ingresos · ${formatNumber(totalIncome)}`}
            />
            <LegendDot
              color='hsl(var(--color-chart-4))'
              label={`Gastos · ${formatNumber(totalExpense)}`}
            />
          </div>
        )}
      </div>

      {/* Leyenda en mobile (stack) */}
      {hasValues && (
        <div className='mt-2 flex md:hidden flex-wrap gap-2 text-[11px]'>
          <LegendPill
            color='hsl(var(--color-chart-2))'
            label={`Ingresos · ${formatNumber(totalIncome)}`}
          />
          <LegendPill
            color='hsl(var(--color-chart-4))'
            label={`Gastos · ${formatNumber(totalExpense)}`}
          />
        </div>
      )}

      <div className='mt-3'>
        {!hasValues ? (
          <EmptyState
            description='No hay ingresos ni gastos en este período. Prueba ampliando el rango de fechas o registrando tu primera transacción.'
            className='h-[320px]'
          />
        ) : (
          <ResponsiveContainer width='100%' height={320}>
            <AreaChart
              data={data}
              margin={{ top: 10, right: 12, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id={gradIncId} x1='0' y1='0' x2='0' y2='1'>
                  <stop
                    offset='0%'
                    stopColor='hsl(var(--color-chart-2))'
                    stopOpacity={0.35}
                  />
                  <stop
                    offset='100%'
                    stopColor='hsl(var(--color-chart-2))'
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id={gradExpId} x1='0' y1='0' x2='0' y2='1'>
                  <stop
                    offset='0%'
                    stopColor='hsl(var(--color-chart-4))'
                    stopOpacity={0.3}
                  />
                  <stop
                    offset='100%'
                    stopColor='hsl(var(--color-chart-4))'
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke='hsl(var(--border) / 0.25)'
                strokeDasharray='3 3'
              />
              <XAxis
                dataKey='date'
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickMargin={8}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
                tickFormatter={formatDateTick}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                tickMargin={8}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v) => {
                  if (currency) {
                    // abreviado (ej. $1.2M / $450k)
                    const abs = Math.abs(v);
                    if (abs >= 1_000_000)
                      return new Intl.NumberFormat(locale, {
                        notation: 'compact',
                        maximumFractionDigits: 1,
                      }).format(v);
                    if (abs >= 10_000)
                      return new Intl.NumberFormat(locale, {
                        notation: 'compact',
                        maximumFractionDigits: 0,
                      }).format(v);
                  }
                  return new Intl.NumberFormat(locale).format(v);
                }}
                // domain automático con relleno sutil
                domain={
                  ['dataMin - dataMin*0.05', 'dataMax + dataMax*0.05'] as any
                }
              />

              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  const inc =
                    (payload.find((p) => p.dataKey === 'income')
                      ?.value as number) || 0;
                  const exp =
                    (payload.find((p) => p.dataKey === 'expense')
                      ?.value as number) || 0;
                  const net = inc - exp;
                  return (
                    <div
                      className='
                      rounded-md border border-[hsl(var(--border))]
                      bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]
                      px-3 py-2 shadow
                    '
                    >
                      <div className='text-[11px] opacity-80 mb-1'>
                        {formatDateTick(String(label))}
                      </div>
                      <div className='flex items-center gap-2 text-sm'>
                        <span
                          className='inline-block h-2.5 w-2.5 rounded-sm'
                          style={{ background: 'hsl(var(--color-chart-2))' }}
                        />
                        <span className='opacity-80'>Ingresos</span>
                        <span className='ml-auto font-medium'>
                          {formatNumber(inc)}
                        </span>
                      </div>
                      <div className='flex items-center gap-2 text-sm'>
                        <span
                          className='inline-block h-2.5 w-2.5 rounded-sm'
                          style={{ background: 'hsl(var(--color-chart-4))' }}
                        />
                        <span className='opacity-80'>Gastos</span>
                        <span className='ml-auto font-medium'>
                          {formatNumber(exp)}
                        </span>
                      </div>
                      <div className='mt-1 pt-1 border-t border-[hsl(var(--border))] flex items-center text-sm'>
                        <span className='opacity-80'>Balance</span>
                        <span
                          className={`ml-auto font-semibold ${
                            net >= 0
                              ? 'text-[hsl(var(--color-chart-2))]'
                              : 'text-[hsl(var(--color-chart-4))]'
                          }`}
                        >
                          {formatNumber(net)}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />

              <Area
                type='monotone'
                dataKey='income'
                stroke='hsl(var(--color-chart-2))'
                fill={`url(#${gradIncId})`}
                strokeWidth={2}
                isAnimationActive
                animationDuration={700}
                dot={false}
                activeDot={{ r: 3 }}
                // mezcla sutil cuando se superponen
                style={{ mixBlendMode: 'multiply' }}
              />
              <Area
                type='monotone'
                dataKey='expense'
                stroke='hsl(var(--color-chart-4))'
                fill={`url(#${gradExpId})`}
                strokeWidth={2}
                isAnimationActive
                animationDuration={700}
                dot={false}
                activeDot={{ r: 3 }}
                style={{ mixBlendMode: 'multiply' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className='flex items-center gap-2'>
      <span className='h-2.5 w-2.5 rounded-sm' style={{ background: color }} />
      <span className='text-[hsl(var(--muted-foreground))]'>{label}</span>
    </div>
  );
}

function LegendPill({ color, label }: { color: string; label: string }) {
  return (
    <div className='inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-2 py-1'>
      <span className='h-2.5 w-2.5 rounded-sm' style={{ background: color }} />
      <span className='text-[hsl(var(--muted-foreground))]'>{label}</span>
    </div>
  );
}
