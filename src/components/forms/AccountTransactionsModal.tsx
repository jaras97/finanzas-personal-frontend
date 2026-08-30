'use client';

import { FormModal } from '@/components/ui/form-modal';
import { Badge } from '@/components/ui/badge';
import { useAccountTransactions } from '@/hooks/useAccountTransactions';
import { formatCurrency } from '@/lib/format';
import DateTimeDisplay from '../ui/DateTimeDisplay';
import { cn } from '@/lib/utils';
import {
  typeColor,
  isCreditCardPurchase,
  getTxCurrency,
  getStatusLabel,
  categoryBadgeClasses,
} from '@/lib/transactionDisplay';
import { TransactionWithCategoryRead } from '@/types';

interface Props {
  accountId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_STYLES: Record<string, string> = {
  Reversada: 'bg-slate-100 text-slate-500 border-slate-200 line-through',
  Reversa: 'bg-amber-50 text-amber-700 border-amber-200',
  'Compra con tarjeta': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  Ingreso: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Egreso: 'bg-rose-50 text-rose-700 border-rose-200',
  Transferencia: 'bg-sky-50 text-sky-700 border-sky-200',
};

function counterpartyLabel(tx: TransactionWithCategoryRead): string | null {
  if (tx.type === 'income' && tx.from_account) {
    return `Desde: ${tx.from_account.name} (${tx.from_account.currency})`;
  }
  if (tx.type === 'expense' && tx.to_account) {
    return `Hacia: ${tx.to_account.name} (${tx.to_account.currency})`;
  }
  return null;
}

export default function AccountTransactionsModal({
  accountId,
  open,
  onOpenChange,
}: Props) {
  const { transactions, loading } = useAccountTransactions(accountId);

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      size='lg'
      className='w-[min(100vw-1rem,560px)]'
      title='Historial de movimientos'
    >
      <div>
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
              {transactions.map((tx) => {
                const isCC = isCreditCardPurchase(tx);
                const status = getStatusLabel(tx);
                const counterparty = counterpartyLabel(tx);

                return (
                  <div
                    key={tx.id}
                    className={cn(
                      'rounded-md border p-3 bg-white shadow-sm',
                      tx.is_cancelled ? 'border-slate-200 opacity-60' : 'border-border',
                    )}
                  >
                    <div className='flex items-start justify-between gap-2'>
                      <p
                        className={cn(
                          'font-medium',
                          isCC ? 'text-fuchsia-600' : typeColor(tx.type),
                          tx.is_cancelled && 'line-through',
                        )}
                      >
                        {isCC ? '💳 ' : ''}
                        {tx.description}
                      </p>
                      <p
                        className={cn(
                          'font-semibold whitespace-nowrap',
                          isCC ? 'text-fuchsia-600' : typeColor(tx.type),
                        )}
                      >
                        {tx.type === 'income' ? '+' : '-'}{' '}
                        {formatCurrency(tx.amount)} {getTxCurrency(tx)}
                      </p>
                    </div>

                    <div className='mt-1 flex items-center justify-between gap-2 text-sm text-muted-foreground'>
                      <DateTimeDisplay isoDate={tx.date} />
                      <Badge
                        className={cn(
                          'border text-xs',
                          STATUS_STYLES[status] ??
                            'bg-slate-50 text-slate-700 border-slate-200',
                        )}
                      >
                        {status}
                      </Badge>
                    </div>

                    {(tx.category || counterparty || (tx.transaction_fee ?? 0) > 0) && (
                      <div className='mt-2 flex flex-wrap items-center gap-1.5'>
                        {tx.category && (
                          <Badge className={cn('border text-xs', categoryBadgeClasses(tx))}>
                            {tx.category.name}
                          </Badge>
                        )}
                        {counterparty && (
                          <span className='text-xs text-muted-foreground'>
                            {counterparty}
                          </span>
                        )}
                        {(tx.transaction_fee ?? 0) > 0 && (
                          <span className='text-xs text-rose-600'>
                            Comisión: {tx.transaction_fee?.toLocaleString()}{' '}
                            {getTxCurrency(tx)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </FormModal>
  );
}
