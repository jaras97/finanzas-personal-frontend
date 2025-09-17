'use client';
import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Label,
} from 'recharts';
import { EmptyState } from '../ui/EmptyState';

type Datum = { name: string; value: number };

// Paleta desde tus tokens (cicla cuando hay muchas categorías)
const TOKEN_COLORS = [
  'hsl(var(--color-chart-1))',
  'hsl(var(--color-chart-2))',
  'hsl(var(--color-chart-3))',
  'hsl(var(--color-chart-4))',
  'hsl(var(--color-chart-5))',
];
const colorAt = (i: number) => TOKEN_COLORS[i % TOKEN_COLORS.length];

// Tooltip custom con tokens
function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any[];
}) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  const value = p?.value ?? 0;
  const name = p?.name ?? '';
  const total = payload[0]?.payload?.__total ?? 1;
  const pct = total ? (value / total) * 100 : 0;

  return (
    <div
      className='rounded-md border border-[hsl(var(--border))]
                    bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]
                    px-3 py-2 shadow'
    >
      <div className='text-xs opacity-80'>{name}</div>
      <div className='text-sm font-medium'>
        {new Intl.NumberFormat().format(value)}{' '}
        <span className='opacity-70'>({pct.toFixed(1)}%)</span>
      </div>
    </div>
  );
}

// Type guard para usar cx/cy en Label
type RadialViewBox = { cx: number; cy: number };
const isRadialViewBox = (vb: unknown): vb is RadialViewBox =>
  !!vb &&
  typeof (vb as any).cx === 'number' &&
  typeof (vb as any).cy === 'number';

// Agrupa categorías pequeñas en “Otros”
function groupSmallCategories(
  data: Datum[],
  maxSlices = 6,
  minPercent = 0.03,
): Datum[] {
  const sorted = [...data].sort((a, b) => (b.value || 0) - (a.value || 0));
  const total = sorted.reduce((acc, d) => acc + (d.value || 0), 0) || 1;

  const main: Datum[] = [];
  const rest: Datum[] = [];

  for (const d of sorted) {
    const pct = (d.value || 0) / total;
    if (main.length < maxSlices && pct >= minPercent) {
      main.push(d);
    } else {
      rest.push(d);
    }
  }

  const restSum = rest.reduce((acc, d) => acc + (d.value || 0), 0);
  if (restSum > 0) main.push({ name: 'Otros', value: restSum });

  return main;
}

export function DonutByCategory({
  title,
  data,
  /** Máximo de categorías “visibles” antes de agrupar */
  maxSlices = 6,
  /** Mínimo % para NO ser agrupada (0.03 = 3%) */
  minPercent = 0.03,
  /** Ángulo mínimo cuando se muestran TODAS (0 para no distorsionar) */
  minSliceAngle = 0,
}: {
  title: string;
  data: Datum[];
  maxSlices?: number;
  minPercent?: number;
  minSliceAngle?: number;
}) {
  // Prepara “todas” y “agrupadas”
  const allData = useMemo(
    () =>
      [...data]
        .filter((d) => (d.value ?? 0) > 0)
        .sort((a, b) => (b.value || 0) - (a.value || 0)),
    [data],
  );
  const groupedData = useMemo(
    () => groupSmallCategories(allData, maxSlices, minPercent),
    [allData, maxSlices, minPercent],
  );

  // Por defecto: AGRUPAR
  const [showAll, setShowAll] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);

  const currentData = showAll ? allData : groupedData;
  const currentTotal = useMemo(
    () => currentData.reduce((acc, d) => acc + (d.value || 0), 0),
    [currentData],
  );

  const isEmpty = currentData.length === 0 || currentTotal === 0;

  // Si cambias modo, resetea el highlight
  const toggleShowAll = () => {
    setShowAll((s) => !s);
    setActiveIndex(null);
  };

  return (
    <div className='chart-surface p-4'>
      <div className='flex items-center justify-between gap-2'>
        <h3 className='text-sm font-medium'>{title}</h3>

        {!isEmpty && (
          <div className='flex items-center gap-2'>
            {/* Toggle agrupación/todas */}
            <button
              className='text-[11px] px-2 py-1 rounded-lg
                       bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]
                       border border-[hsl(var(--border))]
                       active:scale-[0.98] transition'
              onClick={toggleShowAll}
              title={
                showAll
                  ? 'Agrupar categorías pequeñas'
                  : 'Ver todas las categorías'
              }
            >
              {showAll ? 'Agrupar' : 'Ver todas'}
            </button>

            {/* Toggle de leyenda en mobile */}
            <button
              className='md:hidden text-[11px] px-2 py-1 rounded-lg
                       bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]
                       border border-[hsl(var(--border))]
                       active:scale-[0.98] transition'
              onClick={() => setLegendOpen((s) => !s)}
            >
              {legendOpen ? 'Ocultar' : 'Categorías'}
            </button>
          </div>
        )}
      </div>

      <div className='mt-3'>
        {isEmpty ? (
          <EmptyState
            description='No hay categorías con valor en este período.'
            className='h-[280px]'
          />
        ) : (
          <ResponsiveContainer width='100%' height={280}>
            <PieChart>
              <Pie
                data={currentData.map((d) => ({ ...d, __total: currentTotal }))}
                dataKey='value'
                nameKey='name'
                innerRadius={72}
                outerRadius={110}
                paddingAngle={2}
                // Solo forzamos ángulo mínimo cuando se muestran TODAS (para evitar hairlines)
                minAngle={showAll ? minSliceAngle : 0}
                cx='50%'
                cy='50%'
                onMouseEnter={(_, idx) => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {currentData.map((entry, i) => (
                  <Cell
                    key={entry.name + i}
                    fill={colorAt(i)}
                    stroke='transparent'
                    opacity={
                      activeIndex === null || activeIndex === i ? 1 : 0.45
                    }
                  />
                ))}

                {/* Centro con Label y type guard */}
                <Label
                  position='center'
                  content={({ viewBox }) => {
                    if (!isRadialViewBox(viewBox)) return null;
                    const { cx, cy } = viewBox;
                    const active =
                      activeIndex != null ? currentData[activeIndex] : null;
                    const activePct = active
                      ? Math.round((active.value / (currentTotal || 1)) * 100)
                      : null;

                    return (
                      <g>
                        <text
                          x={cx}
                          y={cy - 6}
                          textAnchor='middle'
                          className='fill-[hsl(var(--foreground))]'
                          style={{ fontSize: 12, opacity: 0.8 }}
                        >
                          {active ? active.name : 'Total'}
                        </text>
                        <text
                          x={cx}
                          y={cy + 12}
                          textAnchor='middle'
                          className='fill-[hsl(var(--foreground))]'
                          style={{ fontWeight: 600, fontSize: 16 }}
                        >
                          {active
                            ? `${new Intl.NumberFormat().format(active.value)}${
                                activePct != null ? ` · ${activePct}%` : ''
                              }`
                            : new Intl.NumberFormat().format(currentTotal)}
                        </text>
                      </g>
                    );
                  }}
                />
              </Pie>

              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Leyenda custom (scrollable en mobile) */}
      <div
        className={`
          mt-3 grid gap-2
          ${
            legendOpen
              ? 'grid-cols-2'
              : 'grid-cols-2 max-h-28 overflow-y-auto pr-1'
          }
          md:grid-cols-3
        `}
      >
        {currentData.map((d, i) => {
          const isActive = activeIndex === i;
          const pct = Math.round(((d.value || 0) / (currentTotal || 1)) * 100);
          return (
            <button
              key={d.name + i}
              className={`
                group flex items-center gap-2 rounded-lg px-2 py-1 text-left
                hover:bg-[hsl(var(--accent))]
                transition
                ${isActive ? 'bg-[hsl(var(--accent))]' : ''}
              `}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              onClick={() => setActiveIndex(isActive ? null : i)}
            >
              <span
                className='h-2.5 w-2.5 rounded-sm shrink-0'
                style={{ background: colorAt(i) }}
              />
              <span className='text-xs text-[hsl(var(--foreground))]'>
                {d.name}
              </span>
              <span className='ml-auto text-[11px] text-[hsl(var(--muted-foreground))]'>
                {pct}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
