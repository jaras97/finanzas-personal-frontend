'use client';

import { useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import TransactionFilters, {
  Filters,
} from '@/components/forms/TransactionFilters';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import NewTransactionModal from '@/components/forms/NewTransactionModal';
import EditTransactionModal from '@/components/forms/EditTransactionModal';
import { TransactionWithCategoryRead } from '@/types';
import { reverseTransaction } from '@/utils/reverseTransaction';
import { Pagination } from '@/components/ui/pagination';

export default function TransactionsPage() {
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const { transactions, loading, refresh, totalPages } = useTransactions(
    filters,
    page,
  );
  const [editTx, setEditTx] = useState<TransactionWithCategoryRead | null>(
    null,
  );

  const typeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-green-600';
      case 'expense':
        return 'text-destructive';
      case 'transfer':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusLabel = (tx: TransactionWithCategoryRead) => {
    if (tx.is_cancelled) return 'Reversada';
    if (tx.reversed_transaction_id) return 'Reversa';
    if (tx.source_type === 'credit_card_purchase') return 'Compra con tarjeta';
    if (tx.type === 'income') return 'Ingreso';
    if (tx.type === 'expense') return 'Egreso';
    return 'Transferencia';
  };

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h1 className='text-xl font-semibold'>Transacciones</h1>
        <NewTransactionModal onCreated={refresh} />
      </div>

      <TransactionFilters
        onFilterChange={(f) => {
          setPage(1);
          setFilters(f);
        }}
      />

      {loading ? (
        <p className='text-center p-4 text-muted-foreground'>
          Cargando transacciones...
        </p>
      ) : (
        <>
          <div className='space-y-2'>
            {transactions.map((tx) => {
              console.log(`Rendering transaction ${tx.id}`, tx);
              const isCreditCardPurchase =
                tx.source_type === 'credit_card_purchase';

              const isEditable =
                !tx.is_cancelled &&
                !tx.reversed_transaction_id &&
                !isCreditCardPurchase &&
                !tx.source_type &&
                tx.type !== 'transfer';

              const isReversible =
                !tx.is_cancelled &&
                !tx.reversed_transaction_id &&
                tx.type !== 'transfer' &&
                !isCreditCardPurchase;

              return (
                <Card
                  key={tx.id}
                  className='p-4 flex flex-col md:flex-row md:justify-between md:items-center border border-border bg-card'
                >
                  <div className='space-y-1'>
                    <p
                      className={`font-medium flex items-center gap-1 ${
                        isCreditCardPurchase
                          ? 'text-purple-600'
                          : typeColor(tx.type)
                      }`}
                    >
                      {isCreditCardPurchase && '💳'}
                      {tx.description}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {format(new Date(tx.date), 'dd MMM yyyy')}
                    </p>

                    <div className='flex flex-wrap gap-1'>
                      {tx.category && (
                        <Badge variant='outline'>{tx.category.name}</Badge>
                      )}
                      {tx.debt?.name && (
                        <Badge
                          variant={
                            tx.debt.kind === 'credit_card'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {tx.debt.kind === 'credit_card'
                            ? `💳 Tarjeta: ${tx.debt.name}`
                            : `Deuda: ${tx.debt.name}`}
                        </Badge>
                      )}
                    </div>

                    <div className='text-sm text-muted-foreground space-y-0.5'>
                      {tx.from_account && (
                        <p>
                          De: {tx.from_account.name} ({tx.from_account.currency}
                          )
                        </p>
                      )}
                      {tx.to_account && (
                        <p>
                          Para: {tx.to_account.name} ({tx.to_account.currency})
                        </p>
                      )}
                      {tx.saving_account &&
                        !tx.from_account &&
                        !tx.to_account && (
                          <p>
                            {tx.type === 'income' ? 'A' : 'De'} cuenta:{' '}
                            {tx.saving_account.name} (
                            {tx.saving_account.currency})
                          </p>
                        )}
                      {(tx.transaction_fee ?? 0) > 0 && (
                        <p>
                          Comisión: {tx.transaction_fee?.toLocaleString()}{' '}
                          {tx.saving_account?.currency ?? ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className='text-right mt-2 md:mt-0 space-y-1'>
                    <p
                      className={`text-lg font-bold ${
                        isCreditCardPurchase
                          ? 'text-purple-600'
                          : typeColor(tx.type)
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}{' '}
                      {tx.amount.toLocaleString()}{' '}
                      {tx.saving_account?.currency ?? tx.debt?.currency ?? ''}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {getStatusLabel(tx)}
                    </p>

                    <div className='flex gap-2 justify-end flex-wrap'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setEditTx(tx)}
                        disabled={!isEditable}
                        title={
                          !isEditable
                            ? 'No se puede editar transacciones reversadas, de reversa o compras con tarjeta'
                            : 'Editar transacción'
                        }
                      >
                        Editar
                      </Button>
                      <Button
                        size='sm'
                        variant='destructive'
                        onClick={() => reverseTransaction(tx.id, refresh)}
                        disabled={!isReversible}
                        title={
                          !isReversible
                            ? 'No se puede reversar transacciones reversadas, de reversa, transferencias o compras con tarjeta'
                            : 'Reversar transacción'
                        }
                      >
                        Reversar
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}

            {transactions.length === 0 && (
              <p className='text-center p-4 text-muted-foreground'>
                No hay transacciones con estos filtros.
              </p>
            )}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {editTx && (
        <EditTransactionModal
          open={!!editTx}
          onOpenChange={(open) => {
            if (!open) setEditTx(null);
          }}
          transaction={editTx}
          onUpdated={refresh}
        />
      )}
    </div>
  );
}
