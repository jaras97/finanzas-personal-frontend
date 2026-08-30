'use client';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { useDebtStatement } from '@/hooks/useDebtStatement';
import type { Debt } from '@/types';

function daysUntil(isoDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export default function CreditCardCycleInfo({ debt }: { debt: Debt }) {
  const { data, loading } = useDebtStatement(debt.id, debt.kind);

  if (debt.kind !== 'credit_card' || loading || !data) return null;

  const daysLeft = daysUntil(data.payment_due_date);
  const dueTone =
    daysLeft < 0
      ? 'text-rose-700'
      : daysLeft <= 3
      ? 'text-rose-700'
      : daysLeft <= 7
      ? 'text-amber-700'
      : 'text-slate-600';

  const dueLabel =
    daysLeft < 0
      ? `Venció hace ${Math.abs(daysLeft)} día${Math.abs(daysLeft) === 1 ? '' : 's'}`
      : daysLeft === 0
      ? 'Vence hoy'
      : `Vence en ${daysLeft} día${daysLeft === 1 ? '' : 's'}`;

  const hasLimit = data.available_credit !== null && debt.credit_limit;
  const usedPercent = hasLimit
    ? Math.min(100, Math.max(0, (debt.total_amount / debt.credit_limit!) * 100))
    : null;
  const barTone =
    usedPercent !== null && usedPercent >= 90
      ? 'bg-rose-500'
      : usedPercent !== null && usedPercent >= 75
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  return (
    <div className='space-y-1.5 rounded-md bg-slate-50 p-2 text-xs'>
      {hasLimit && (
        <div className='space-y-1'>
          <div className='flex justify-between text-slate-600'>
            <span>Disponible</span>
            <span className='tabular-nums'>
              {formatCurrency(data.available_credit!, debt.currency)}
            </span>
          </div>
          <div className='h-1.5 w-full rounded-full bg-slate-200 overflow-hidden'>
            <div
              className={cn('h-full rounded-full', barTone)}
              style={{ width: `${usedPercent}%` }}
            />
          </div>
        </div>
      )}
      <p className={cn('font-medium', dueTone)}>{dueLabel}</p>
      {data.minimum_payment_estimate !== null && (
        <p className='text-slate-600'>
          Pago mínimo estimado:{' '}
          <span className='font-medium'>
            {formatCurrency(data.minimum_payment_estimate, debt.currency)}
          </span>
        </p>
      )}
    </div>
  );
}
