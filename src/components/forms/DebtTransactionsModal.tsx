'use client';

import { useEffect, useState } from 'react';
import { FormModal } from '@/components/ui/form-modal';
import { Debt, DebtTransaction } from '@/types';
import api from '@/lib/api';
import DateTimeDisplay from '../ui/DateTimeDisplay';
import { formatCurrency } from '@/lib/format';

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

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      size='lg'
      className='w-[min(100vw-1rem,560px)]'
      title={`Movimientos de ${debt.name}`}
    >
      <div aria-busy={loading}>
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
      </div>
    </FormModal>
  );
}
