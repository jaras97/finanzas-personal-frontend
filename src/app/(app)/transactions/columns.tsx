'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import DateTimeDisplay from '@/components/ui/DateTimeDisplay';
import { Button } from '@/components/ui/button';
import { StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TransactionWithCategoryRead } from '@/types';

// Aux: el campo `type` típico en tus transacciones
type TxType = TransactionWithCategoryRead['type'] | 'transfer';

// Aux: categoría que podría venir con marcas de sistema
type SystemishCategory = {
  name?: string;
  is_system?: boolean;
  origin?: string;
};

const typeColor = (type: TxType): string =>
  type === 'income'
    ? 'text-emerald-600'
    : type === 'expense'
    ? 'text-rose-600'
    : 'text-primary';

const isCreditCardPurchase = (tx: TransactionWithCategoryRead): boolean =>
  tx.source_type === 'credit_card_purchase';

const getTxCurrency = (tx: TransactionWithCategoryRead): string =>
  tx.saving_account?.currency ?? tx.debt?.currency ?? '';

const getStatusLabel = (tx: TransactionWithCategoryRead): string => {
  if (tx.is_cancelled) return 'Reversada';
  if (tx.reversed_transaction_id) return 'Reversa';
  if (isCreditCardPurchase(tx)) return 'Compra con tarjeta';
  if (tx.type === 'income') return 'Ingreso';
  if (tx.type === 'expense') return 'Egreso';
  return 'Transferencia';
};

/** Paleta para categorías de sistema (ajusta nombres si cambian en tu seed) */
const SYSTEM_CATEGORY_STYLES: Record<string, string> = {
  Transferencia: 'bg-sky-50 text-sky-700 border-sky-200',
  'Pago de deuda': 'bg-amber-50 text-amber-700 border-amber-200',
  Comisión: 'bg-rose-50 text-rose-700 border-rose-200',
  Interés: 'bg-violet-50 text-violet-700 border-violet-200',
  Ajuste: 'bg-slate-50 text-slate-700 border-slate-200',
};

function categoryBadgeClasses(tx: TransactionWithCategoryRead): string {
  const cat = tx.category as SystemishCategory | undefined;
  if (!cat) return '';

  const isSystem = cat.is_system === true || cat.origin === 'system';
  if (isSystem) {
    const key = cat.name ?? '';
    return (
      SYSTEM_CATEGORY_STYLES[key] ??
      'bg-slate-50 text-slate-700 border-slate-200'
    );
  }

  // Categorías de usuario: verde pastel ingresos, rojo pastel egresos
  if (tx.type === 'income') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (tx.type === 'expense') {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

export function buildTransactionColumns(opts: {
  onEdit: (tx: TransactionWithCategoryRead) => void;
  onReverse: (tx: TransactionWithCategoryRead) => void;
  onShowNote: (tx: TransactionWithCategoryRead) => void;
}): ColumnDef<TransactionWithCategoryRead, unknown>[] {
  const { onEdit, onReverse, onShowNote } = opts;

  return [
    {
      accessorKey: 'description',
      header: 'Descripción',
      cell: ({ row }) => {
        const tx = row.original;
        const isCC = isCreditCardPurchase(tx);
        return (
          <div
            className={cn(
              'font-medium',
              isCC ? 'text-fuchsia-600' : typeColor(tx.type),
            )}
          >
            {isCC ? '💳 ' : ''}
            {tx.description}
          </div>
        );
      },
    },
    {
      accessorKey: 'date',
      header: 'Fecha',
      cell: ({ row }) => (
        <span className='text-muted-foreground'>
          <DateTimeDisplay isoDate={row.original.date} />
        </span>
      ),
      sortingFn: 'datetime' as const,
    },
    {
      id: 'category',
      header: 'Categoría',
      enableSorting: false,
      cell: ({ row }) => {
        const tx = row.original;
        return (
          <div className='flex gap-1 flex-wrap'>
            {tx.category && (
              <Badge className={cn('border', categoryBadgeClasses(tx))}>
                {tx.category.name}
              </Badge>
            )}
            {tx.debt?.name && (
              <Badge
                className={cn(
                  'border',
                  tx.debt.kind === 'credit_card'
                    ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200',
                )}
              >
                {tx.debt.kind === 'credit_card'
                  ? `💳 Tarjeta: ${tx.debt.name}`
                  : `Deuda: ${tx.debt.name}`}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'routes',
      header: 'Desde / Hacia',
      enableSorting: false,
      cell: ({ row }) => {
        const tx = row.original;
        return (
          <div className='text-muted-foreground space-y-0.5'>
            {tx.from_account && (
              <div>
                De: {tx.from_account.name} ({tx.from_account.currency})
              </div>
            )}
            {tx.to_account && (
              <div>
                Para: {tx.to_account.name} ({tx.to_account.currency})
              </div>
            )}
            {tx.saving_account && !tx.from_account && !tx.to_account && (
              <div>
                {tx.type === 'income' ? 'A' : 'De'} cuenta:{' '}
                {tx.saving_account.name} ({tx.saving_account.currency})
              </div>
            )}
            {(tx.transaction_fee ?? 0) > 0 && (
              <div>
                Comisión: {tx.transaction_fee?.toLocaleString()}{' '}
                {getTxCurrency(tx)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Monto',
      cell: ({ row }) => {
        const tx = row.original;
        const isCC = isCreditCardPurchase(tx);
        return (
          <div
            className={cn(
              'text-right font-semibold',
              isCC ? 'text-fuchsia-600' : typeColor(tx.type),
            )}
          >
            {tx.type === 'income' ? '+' : '-'} {tx.amount.toLocaleString()}{' '}
            {getTxCurrency(tx)}
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Estado',
      enableSorting: false,
      cell: ({ row }) => (
        <div className='text-right text-muted-foreground'>
          {getStatusLabel(row.original)}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => {
        const tx = row.original;
        const isCC = isCreditCardPurchase(tx);
        const isEditable =
          !tx.is_cancelled &&
          !tx.reversed_transaction_id &&
          !isCC &&
          !tx.source_type;
        const isReversible =
          !tx.is_cancelled &&
          !tx.reversed_transaction_id &&
          tx.type !== 'transfer';
        const showNoteButton =
          tx.is_cancelled && !!(tx.reversal_note && tx.reversal_note.trim());

        return (
          <div className='flex justify-end gap-2'>
            {isEditable && (
              <Button size='sm' variant='soft-sky' onClick={() => onEdit(tx)}>
                Editar
              </Button>
            )}
            {showNoteButton && (
              <Button
                size='sm'
                variant='soft-amber'
                onClick={() => onShowNote(tx)}
              >
                <StickyNote className='w-4 h-4 mr-1' />
                Nota
              </Button>
            )}
            <Button
              size='sm'
              variant='soft-rose'
              onClick={() => onReverse(tx)}
              disabled={!isReversible}
            >
              Reversar
            </Button>
          </div>
        );
      },
    },
  ];
}
