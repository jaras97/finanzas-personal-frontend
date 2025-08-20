'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useAccountTransactions } from '@/hooks/useAccountTransactions';
import { formatCurrency } from '@/lib/format';
import DateTimeDisplay from '../ui/DateTimeDisplay';
import { cn } from '@/lib/utils';

interface Props {
  accountId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AccountTransactionsModal({
  accountId,
  open,
  onOpenChange,
}: Props) {
  const { transactions, loading } = useAccountTransactions(accountId);

  const headerTint = 'bg-[hsl(var(--muted))]';
  const panelTint = 'bg-[hsl(var(--accent))]'; // 👈 content más notorio que las cards (bg-background)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size='lg'
        className={cn(
          'grid grid-rows-[auto_minmax(0,1fr)] max-h-[92dvh] min-h-0',
          'w-[min(100vw-1rem,560px)] overflow-hidden',
          panelTint, // 👈 aplica el tinte del panel
        )}
      >
        {/* HEADER tintado */}
        <header className={cn('border-b px-4 py-3', headerTint)}>
          <DialogTitle className='text-base sm:text-lg font-semibold'>
            Historial de movimientos
          </DialogTitle>
        </header>

        {/* BODY con scroll */}
        <section className='min-h-0 overflow-y-auto overscroll-contain px-4 py-4'>
          {loading ? (
            <p className='text-center text-sm text-muted-foreground'>
              Cargando movimientos...
            </p>
          ) : transactions.length === 0 ? (
            <p className='text-center text-sm text-muted-foreground'>
              No hay movimientos en esta cuenta.
            </p>
          ) : (
            <div className='space-y-2 pr-1'>
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className='border border-border rounded-md p-3 bg-white'
                >
                  <p className='font-medium'>{tx.description}</p>
                  <p className='text-sm text-muted-foreground'>
                    <DateTimeDisplay isoDate={tx.date} />{' '}
                    {tx.type === 'income' ? '+' : '-'}{' '}
                    {formatCurrency(tx.amount)} {tx.saving_account?.currency}
                  </p>
                  {tx.category && (
                    <p className='text-xs text-muted-foreground'>
                      Categoría: {tx.category.name}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}
