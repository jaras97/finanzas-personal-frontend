'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Debt, DebtTransaction } from '@/types';
import api from '@/lib/api';
import DateTimeDisplay from '../ui/DateTimeDisplay';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: Debt;
}

export default function DebtTransactionsModal({
  open,
  onOpenChange,
  debt,
}: Props) {
  const [transactions, setTransactions] = useState<DebtTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!debt?.id || !open) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/debts/${debt.id}/transactions`);
        if (!cancelled) setTransactions(res.data);
      } catch (error) {
        if (!cancelled) console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debt?.id, open]);

  const headerTint = 'bg-[hsl(var(--muted))]';
  const panelTint = 'bg-[hsl(var(--accent))]';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size='lg'
        className={cn(
          'grid grid-rows-[auto_minmax(0,1fr)] max-h-[92dvh] min-h-0',
          'w-[min(100vw-1rem,560px)] overflow-hidden',
          panelTint,
        )}
      >
        {/* HEADER */}
        <header className={cn('border-b px-4 py-3', headerTint)}>
          <DialogTitle className='text-base sm:text-lg font-semibold'>
            Movimientos de {debt.name}
          </DialogTitle>
        </header>

        {/* BODY (scroll) */}
        <section
          className='min-h-0 overflow-y-auto overscroll-contain px-4 py-4'
          aria-busy={loading}
        >
          {loading ? (
            <p className='text-center text-sm text-muted-foreground'>
              Cargando movimientos...
            </p>
          ) : transactions.length === 0 ? (
            <p className='text-center text-sm text-muted-foreground'>
              No hay movimientos registrados.
            </p>
          ) : (
            <div className='space-y-2 pr-1'>
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className='border border-border rounded-md p-3 bg-white'
                >
                  <p className='font-medium'>
                    {tx.description || 'Sin descripción'}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {tx.type === 'payment' ? 'Pago' : 'Cargo'} |{' '}
                    <DateTimeDisplay isoDate={tx.date} /> |{' '}
                    {formatCurrency(tx.amount)} {debt.currency}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}
