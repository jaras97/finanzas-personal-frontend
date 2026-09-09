'use client';

import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { categoryColor } from '@/lib/categoryStyle';
import { categoryIcon } from '@/lib/categoryIcon';
import { formatCurrency } from '@/lib/format';
import type { CategorySummary } from '@/hooks/useSummary';
import { SIN_CATEGORIA_ID } from '@/hooks/useSummary';
import { ChevronRight, Lock } from 'lucide-react';
import { HOJA_SINTETICA } from '@/lib/categoryTree';

const esHojaSintetica = (nombre: string) => nombre === HOJA_SINTETICA;

/**
 * Desglose por categoría con drill-down.
 *
 * Reemplaza a los dos donuts (gastos e ingresos) que había lado a lado: a
 * media pantalla no se comparaban entre sí, y los ingresos son tres
 * categorías contra veinticinco de gasto — no merecen el mismo peso visual.
 *
 * Por defecto muestra GRUPOS (ocho rebanadas legibles). Al entrar en uno se
 * ven sus hojas, en tonos del color del grupo, para que se lea que sigues
 * dentro de él sin depender solo de la migaja de pan.
 *
 * El detalle viene anidado en la misma respuesta de `/summary`, así que
 * entrar y salir no cuesta ninguna petición.
 */

/**
 * ¿Vale la pena entrar en este grupo?
 *
 * No, si su único detalle es la hoja sintética: el drill-down mostraría una
 * rebanada llamada «General» y nada más. Misma regla que la lista de
 * categorías (`esHojaSintetica`), para que la app no se contradiga.
 */
function tieneDesglose(c: CategorySummary): boolean {
  if (c.children.length === 0) return false;
  if (c.children.length === 1 && esHojaSintetica(c.children[0].category_name)) return false;
  return true;
}

type Props = {
  expense: CategorySummary[];
  income: CategorySummary[];
  currency: string;
  /** Se llama al pulsar la fila de «Sin categorizar». */
  onFixUncategorized?: () => void;
};

/** Tonos derivados del color del grupo, del más saturado al más claro. */
function tonosDe(base: string, n: number): string[] {
  // Se mezcla el color del grupo con blanco en pasos regulares. Mantiene el
  // matiz (se reconoce el grupo) y separa las hojas por claridad.
  const m = base.match(/^#([0-9a-f]{6})$/i);
  if (!m) return Array(n).fill(base);
  const num = parseInt(m[1], 16);
  const [r, g, b] = [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  return Array.from({ length: n }, (_, i) => {
    const t = n <= 1 ? 0 : (i / (n - 1)) * 0.55;
    const mez = (c: number) => Math.round(c + (255 - c) * t);
    return `#${[mez(r), mez(g), mez(b)].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  });
}

function Variacion({ valor }: { valor: number | null }) {
  if (valor === null) {
    return <span className='text-muted-foreground'>—</span>;
  }
  const sube = valor > 0;
  const neutro = Math.abs(valor) < 0.05;
  return (
    <span
      className={cn(
        neutro
          ? 'text-muted-foreground'
          : sube
          ? 'text-rose-700'
          : 'text-emerald-700',
      )}
    >
      {neutro ? '0%' : `${sube ? '+' : '−'}${Math.abs(valor).toFixed(0)}%`}
    </span>
  );
}

export function CategoryBreakdown({
  expense,
  income,
  currency,
  onFixUncategorized,
}: Props) {
  const [tipo, setTipo] = useState<'expense' | 'income'>('expense');
  const [grupoId, setGrupoId] = useState<number | null>(null);

  const base = tipo === 'expense' ? expense : income;
  const grupo = grupoId !== null ? base.find((c) => c.category_id === grupoId) : undefined;

  // Dentro de un grupo se listan sus hojas; fuera, los grupos.
  const filas = grupo ? grupo.children : base;
  const total = filas.reduce((a, c) => a + c.total, 0);

  const colores = useMemo(() => {
    if (grupo) {
      return tonosDe(
        categoryColor({ name: grupo.category_name, color: grupo.color }),
        grupo.children.length,
      );
    }
    return filas.map((c) => categoryColor({ name: c.category_name, color: c.color }));
  }, [grupo, filas]);

  const datos = filas.map((c, i) => ({ ...c, fill: colores[i] ?? '#94a3b8' }));

  const cambiarTipo = (t: 'expense' | 'income') => {
    setTipo(t);
    setGrupoId(null);
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-3 flex-wrap'>
        <div className='flex items-center gap-2 min-w-0'>
          {grupo ? (
            <>
              <button
                type='button'
                onClick={() => setGrupoId(null)}
                className='text-sm text-[hsl(var(--primary))] hover:underline'
              >
                Desglose por categoría
              </button>
              <ChevronRight className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
              <span className='text-[15px] font-semibold truncate'>
                {grupo.category_name}
              </span>
            </>
          ) : (
            <h3 className='text-[15px] font-semibold'>Desglose por categoría</h3>
          )}
        </div>

        <div className='flex bg-[hsl(var(--muted))] rounded-lg p-[3px]'>
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              type='button'
              onClick={() => cambiarTipo(t)}
              aria-pressed={tipo === t}
              className={cn(
                'px-4 py-1.5 rounded-md text-[13px] font-medium transition-colors',
                tipo === t
                  ? 'bg-white text-[hsl(var(--foreground))] shadow-sm'
                  : 'text-muted-foreground hover:text-[hsl(var(--foreground))]',
              )}
            >
              {t === 'expense' ? 'Gastos' : 'Ingresos'}
            </button>
          ))}
        </div>
      </div>

      {filas.length === 0 ? (
        <p className='text-sm text-muted-foreground py-10 text-center'>
          No hay movimientos en este período.
        </p>
      ) : (
        <div className='flex flex-col lg:flex-row gap-6'>
          {/* Donut */}
          <div className='flex-none lg:w-[240px] flex flex-col items-center gap-3'>
            <div className='relative w-[200px] h-[200px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={datos}
                    dataKey='total'
                    nameKey='category_name'
                    innerRadius={64}
                    outerRadius={96}
                    paddingAngle={2}
                    stroke='transparent'
                    onClick={(_, i) => {
                      const f = datos[i];
                      if (!grupo && f && tieneDesglose(f)) setGrupoId(f.category_id);
                    }}
                  >
                    {datos.map((d) => (
                      <Cell
                        key={d.category_id}
                        fill={d.fill}
                        cursor={!grupo && tieneDesglose(d) ? 'pointer' : 'default'}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
                <span className='text-[11px] uppercase tracking-wide text-muted-foreground'>
                  {grupo ? grupo.category_name : tipo === 'expense' ? 'Gasto total' : 'Ingreso total'}
                </span>
                <span className='text-xl font-semibold tabular-nums'>
                  {formatCurrency(total, currency)}
                </span>
              </div>
            </div>
            <p className='text-xs text-muted-foreground text-center max-w-[200px]'>
              {grupo
                ? 'Vuelve arriba para ver todas las categorías'
                : 'Clic en una categoría para ver su desglose'}
            </p>
          </div>

          {/* Tabla */}
          <div className='flex-1 min-w-0 overflow-x-auto'>
            <div className='min-w-[420px]'>
              <div className='grid grid-cols-[1fr_120px_56px_80px] gap-3 px-2 pb-2 border-b border-[hsl(var(--border))]'>
                {['Categoría', 'Total', '%', 'vs. antes'].map((h, i) => (
                  <span
                    key={h}
                    className={cn(
                      'text-[11px] font-semibold uppercase tracking-wide text-muted-foreground',
                      i > 0 && 'text-right',
                    )}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {datos.map((c) => {
                const navegable = !grupo && tieneDesglose(c);
                const pendiente = c.category_id === SIN_CATEGORIA_ID;
                const Icono = categoryIcon(c.icon);
                return (
                  <div
                    key={c.category_id}
                    onClick={() => {
                      if (navegable) setGrupoId(c.category_id);
                      else if (pendiente) onFixUncategorized?.();
                    }}
                    className={cn(
                      'grid grid-cols-[1fr_120px_56px_80px] gap-3 items-center px-2 py-2.5',
                      'border-b border-[hsl(var(--border))]/40 text-sm',
                      (navegable || pendiente) && 'cursor-pointer hover:bg-[hsl(var(--muted))]/50',
                      pendiente && 'border-l-2 border-l-amber-400 bg-amber-50/40',
                    )}
                  >
                    <span className='flex items-center gap-2.5 min-w-0'>
                      {!grupo && (
                        <span
                          className='inline-flex h-6 w-6 items-center justify-center rounded-md shrink-0'
                          style={{ background: `${c.fill}22`, color: c.fill }}
                          aria-hidden='true'
                        >
                          <Icono className='h-3.5 w-3.5' />
                        </span>
                      )}
                      <span className='truncate'>{c.category_name}</span>
                      {navegable && (
                        <span className='shrink-0 inline-flex items-center gap-1 text-[11px] text-muted-foreground border border-[hsl(var(--border))] rounded-full px-1.5'>
                          {c.children.length}
                          <ChevronRight className='h-3 w-3' />
                        </span>
                      )}
                      {pendiente && (
                        <span className='shrink-0 inline-flex items-center gap-1 text-[11px] text-amber-700'>
                          <Lock className='h-3 w-3' /> Clasificar
                        </span>
                      )}
                    </span>
                    <span className='text-right tabular-nums'>
                      {formatCurrency(c.total, currency)}
                    </span>
                    <span className='text-right tabular-nums text-muted-foreground text-[13px]'>
                      {c.percentage.toFixed(0)}%
                    </span>
                    <span className='text-right tabular-nums text-[13px]'>
                      <Variacion valor={c.delta_percentage} />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
