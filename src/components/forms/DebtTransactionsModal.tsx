'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Debt, DebtTransaction } from '@/types';
import { format } from 'date-fns';
import api from '@/lib/api';

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
    const fetchTransactions = async () => {
      if (!debt || !open) return;
      setLoading(true);
      try {
        const res = await api.get(`/debts/${debt.id}/transactions`);
        setTransactions(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [debt, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Movimientos de {debt.name}</DialogTitle>
        </DialogHeader>
        <div className='space-y-2 max-h-[60vh] overflow-y-auto'>
          {loading ? (
            <p className='text-center'>Cargando movimientos...</p>
          ) : transactions.length === 0 ? (
            <p className='text-center text-muted-foreground'>
              No hay movimientos registrados.
            </p>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className='rounded border p-3 bg-card text-card-foreground shadow-sm'
              >
                <p className='font-medium'>
                  {tx.description || 'Sin descripción'}
                </p>
                <p className='text-sm text-muted-foreground'>
                  {tx.type === 'payment' ? 'Pago' : 'Cargo'} |{' '}
                  {format(new Date(tx.date), 'dd MMM yyyy')} |{' '}
                  {tx.amount.toLocaleString()} {debt.currency}
                </p>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
