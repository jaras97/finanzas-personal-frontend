import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAccountTransactions } from '@/hooks/useAccountTransactions';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/format';

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg bg-card text-foreground'>
        <DialogHeader>
          <DialogTitle>Historial de movimientos</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className='text-center text-sm text-muted-foreground'>
            Cargando movimientos...
          </p>
        ) : transactions.length === 0 ? (
          <p className='text-center text-sm text-muted-foreground'>
            No hay movimientos en esta cuenta.
          </p>
        ) : (
          <div className='space-y-2 max-h-[60vh] overflow-y-auto pr-1'>
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className='border border-border rounded-md p-3 bg-background'
              >
                <p className='font-medium'>{tx.description}</p>
                <p className='text-sm text-muted-foreground'>
                  {format(new Date(tx.date), 'dd MMM yyyy')} :{' '}
                  {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}{' '}
                  {tx.saving_account?.currency}
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
      </DialogContent>
    </Dialog>
  );
}
