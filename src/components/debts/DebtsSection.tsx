'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import type { Debt } from '@/types';
import { format } from 'date-fns';

type Tone = 'loan' | 'credit';

const toneMap: Record<
  Tone,
  { solid: string; outline: string; border: string }
> = {
  loan: {
    solid:
      'bg-amber-600 text-white hover:bg-amber-700 focus-visible:ring-amber-300',
    outline:
      'border-amber-300 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-50/80',
    border: 'border-amber-200 dark:border-amber-700',
  },
  credit: {
    solid:
      'bg-fuchsia-600 text-white hover:bg-fuchsia-700 focus-visible:ring-fuchsia-300',
    outline:
      'border-fuchsia-300 text-fuchsia-700 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-50/80',
    border: 'border-fuchsia-200 dark:border-fuchsia-700',
  },
};

export type DebtsSectionProps = {
  title: string;
  hint?: string;
  /** Lista de deudas a mostrar (misma moneda mezclada está ok). */
  items: Debt[];
  loading: boolean;
  emptyText: string;

  /** Acciones por deuda (mantenemos tu policy centralizada) */
  getDebtActions: (d: Debt) => {
    isPristine: boolean;
    canClose: boolean;
    canReopen: boolean;
  };

  /** Handlers */
  onPay: (d: Debt) => void;
  onCharge: (d: Debt) => void;
  onViewTx: (d: Debt) => void;
  onEdit: (d: Debt) => void;
  onClose: (d: Debt) => void;
  onDelete: (d: Debt) => void;
  onReopen?: (d: Debt) => void; // solo para sección cerradas

  /** Tono visual: préstamos(amber) o tarjetas(fuchsia) */
  tone?: Tone;

  /** Cuando sea sección de cerradas */
  closed?: boolean;

  className?: string;
  cardClassName?: string;
};

export default function DebtsSection({
  title,
  hint,
  items,
  loading,
  emptyText,
  getDebtActions,
  onPay,
  onCharge,
  onViewTx,
  onEdit,
  onClose,
  onDelete,
  onReopen,
  tone = 'loan',
  closed = false,
  className,
  cardClassName,
}: DebtsSectionProps) {
  const t = toneMap[tone];

  return (
    <section className={cn('space-y-3', className)}>
      <header className='flex items-center justify-between'>
        <div>
          <h2 className='text-sm font-medium text-muted-foreground'>{title}</h2>
          {hint && <p className='text-xs text-muted-foreground/80'>{hint}</p>}
        </div>
      </header>

      {loading ? (
        <p className='text-center p-4'>Cargando deudas...</p>
      ) : items.length ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
          {items.map((debt) => {
            const { isPristine, canClose, canReopen } = getDebtActions(debt);

            return (
              <Card
                key={debt.id}
                variant='white'
                className={cn(
                  'p-4 space-y-2 border text-slate-900',
                  closed && 'bg-slate-50 dark:bg-slate-900/40',
                  closed ? 'border-slate-200 dark:border-slate-700' : t.border,
                  cardClassName,
                )}
              >
                <div className='flex items-center justify-between'>
                  <p className='font-medium truncate'>{debt.name}</p>
                  <span className='text-[11px] px-2 py-0.5 rounded-full border bg-white/70 dark:bg-white/10'>
                    {debt.kind === 'credit_card'
                      ? 'Tarjeta de Crédito'
                      : 'Préstamo'}
                  </span>
                </div>

                <div className='space-y-0.5'>
                  <p className='text-sm/6 text-slate-600'>
                    Saldo: {formatCurrency(debt.total_amount)} {debt.currency}
                  </p>
                  <p className='text-xs/5 text-slate-500'>
                    Interés: {debt.interest_rate ?? 0}%
                  </p>
                  {!!debt.due_date && (
                    <p className='text-xs/5 text-slate-500'>
                      Vence: {format(new Date(debt.due_date), 'dd MMM yyyy')}
                    </p>
                  )}
                  <p
                    className={cn(
                      'text-xs/5 font-medium',
                      closed ? 'text-amber-700' : 'text-emerald-700',
                    )}
                  >
                    {closed ? 'Cerrada' : 'Activa'}
                  </p>
                  {isPristine && !closed && (
                    <p className='text-xs/5 text-emerald-700'>
                      Deuda prístina (sin movimientos)
                    </p>
                  )}
                </div>

                <div className='flex flex-wrap gap-2 mt-2'>
                  {/* comunes */}
                  <Button
                    size='sm'
                    variant='outline'
                    className={t.outline}
                    onClick={() => onViewTx(debt)}
                  >
                    Ver movimientos
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    className={t.outline}
                    onClick={() => onEdit(debt)}
                  >
                    Editar
                  </Button>

                  {closed ? (
                    <>
                      {canReopen && onReopen && (
                        <Button
                          size='sm'
                          className={t.solid}
                          onClick={() => onReopen(debt)}
                        >
                          Reabrir
                        </Button>
                      )}
                      {isPristine && (
                        <Button
                          size='sm'
                          variant='destructive'
                          onClick={() => onDelete(debt)}
                        >
                          Eliminar
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Button
                        size='sm'
                        className={t.solid}
                        onClick={() => onPay(debt)}
                      >
                        Pagar
                      </Button>
                      <Button
                        size='sm'
                        variant='secondary'
                        onClick={() => onCharge(debt)}
                      >
                        Agregar cargo
                      </Button>

                      {canClose && (
                        <Button
                          size='sm'
                          variant='destructive'
                          onClick={() => onClose(debt)}
                        >
                          Cerrar
                        </Button>
                      )}

                      {isPristine && (
                        <Button
                          size='sm'
                          variant='destructive'
                          onClick={() => onDelete(debt)}
                        >
                          Eliminar
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className='text-center p-4 text-muted-foreground'>{emptyText}</p>
      )}
    </section>
  );
}
