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

type Datum = { name: string; value: number };

// Colores desde tus tokens (cicla si hay más slices)
const TOKEN_COLORS = [
  'hsl(var(--color-chart-1))',
  'hsl(var(--color-chart-2))',
  'hsl(var(--color-chart-3))',
  'hsl(var(--color-chart-4))',
  'hsl(var(--color-chart-5))',
];
const colorAt = (i: number) => TOKEN_COLORS[i % TOKEN_COLORS.length];

// Agrupa categorías pequeñas en “Otros” para evitar slices diminutos
function prepareData(data: Datum[], maxSlices = 6, minPercent = 0.03): Datum[] {
  const sorted = [...data].sort((a, b) => b.value - a.value);
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

// Tooltip custom usando tus tokens de card
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
      className='
        rounded-md border border-[hsl(var(--border))]
        bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]
        px-3 py-2 shadow
      '
    >
      <div className='text-xs opacity-80'>{name}</div>
      <div className='text-sm font-medium'>
        {new Intl.NumberFormat().format(value)}{' '}
        <span className='opacity-70'>({pct.toFixed(1)}%)</span>
      </div>
    </div>
  );
}

// Guarda de tipo para usar cx/cy en Label
type RadialViewBox = { cx: number; cy: number };
const isRadialViewBox = (vb: unknown): vb is RadialViewBox =>
  !!vb &&
  typeof (vb as any).cx === 'number' &&
  typeof (vb as any).cy === 'number';

export function DonutByCategory({
  title,
  data,
  maxSlices = 6,
  minPercent = 0.03,
}: {
  title: string;
  data: Datum[];
  maxSlices?: number;
  minPercent?: number;
}) {
  const total = useMemo(
    () => data.reduce((acc, d) => acc + (d.value || 0), 0),
    [data],
  );
  const prepared = useMemo(
    () => prepareData(data, maxSlices, minPercent),
    [data, maxSlices, minPercent],
  );

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);

  return (
    <div className='chart-surface p-4'>
      <div className='flex items-center justify-between gap-2'>
        <h3 className='text-sm font-medium'>{title}</h3>

        {/* Toggle de leyenda en mobile */}
        <button
          className='
            md:hidden text-[11px] px-2 py-1 rounded-lg
            bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]
            border border-[hsl(var(--border))]
            active:scale-[0.98] transition
          '
          onClick={() => setLegendOpen((s) => !s)}
        >
          {legendOpen ? 'Ocultar' : 'Ver categorías'}
        </button>
      </div>

      <div className='mt-3'>
        <ResponsiveContainer width='100%' height={280}>
          <PieChart>
            <Pie
              data={prepared.map((d) => ({ ...d, __total: total }))}
              dataKey='value'
              nameKey='name'
              innerRadius={72}
              outerRadius={110}
              paddingAngle={2}
              cx='50%'
              cy='50%'
              onMouseEnter={(_, idx) => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {prepared.map((entry, i) => (
                <Cell
                  key={entry.name + i}
                  fill={colorAt(i)}
                  stroke='transparent' // sin bordes
                  opacity={activeIndex === null || activeIndex === i ? 1 : 0.45}
                />
              ))}

              {/* Centro con Label + type guard para cx/cy */}
              <Label
                position='center'
                content={({ viewBox }) => {
                  if (!isRadialViewBox(viewBox)) return null;
                  const { cx, cy } = viewBox;
                  const active =
                    activeIndex != null ? prepared[activeIndex] : null;
                  const activePct = active
                    ? Math.round((active.value / (total || 1)) * 100)
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
                          : new Intl.NumberFormat().format(total)}
                      </text>
                    </g>
                  );
                }}
              />
            </Pie>

            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Leyenda custom (no se desborda en mobile) */}
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
        {prepared.map((d, i) => {
          const isActive = activeIndex === i;
          const pct = Math.round(((d.value || 0) / (total || 1)) * 100);
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
