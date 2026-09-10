'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import DateTimeDisplay from '@/components/ui/DateTimeDisplay';
import { Button } from '@/components/ui/button';
import { StickyNote, Tag, Paperclip } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Category, TransactionWithCategoryRead } from '@/types';
import CategoryChipEditor from '@/components/transactions/CategoryChipEditor';
import {
  typeColor,
  isCreditCardPurchase,
  isTransferLeg,
  getTxCurrency,
  getStatusLabel,
  transferDisplayDescription,
  transferAmountDisplay,
  type DisplayTransaction,
} from '@/lib/transactionDisplay';

export function buildTransactionColumns(opts: {
  onEdit: (tx: TransactionWithCategoryRead) => void;
  onReverse: (tx: TransactionWithCategoryRead) => void;
  onShowNote: (tx: TransactionWithCategoryRead) => void;
  onCreateRule: (tx: TransactionWithCategoryRead) => void;
  onAttachments: (tx: TransactionWithCategoryRead) => void;
  /** Árbol completo, para el selector inline de la columna Categoría. */
  categories: Category[];
  /** Tras cambiar la categoría desde la lista. */
  onCategoryChanged: () => void;
}): ColumnDef<DisplayTransaction, unknown>[] {
  const {
    onEdit,
    onReverse,
    onShowNote,
    onCreateRule,
    onAttachments,
    categories,
    onCategoryChanged,
  } = opts;

  return [
    {
      accessorKey: 'description',
      header: 'Descripción',
      cell: ({ row }) => {
        const tx = row.original;
        const isCC = isCreditCardPurchase(tx);
        const isTransfer = isTransferLeg(tx);
        return (
          <div
            className={cn(
              'font-medium',
              isCC ? 'text-fuchsia-600' : isTransfer ? 'text-primary' : typeColor(tx.type),
            )}
          >
            {isCC ? '💳 ' : ''}
            {isTransfer ? transferDisplayDescription(tx) : tx.description}
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
            {/* El chip es el control: cambiar de categoría no debería exigir
                abrir el modal de edición completo. */}
            <CategoryChipEditor
              tx={tx}
              categories={categories}
              onChanged={onCategoryChanged}
            />
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
        const isTransfer = isTransferLeg(tx);
        return (
          <div
            className={cn(
              'text-right font-semibold',
              isCC ? 'text-fuchsia-600' : isTransfer ? 'text-primary' : typeColor(tx.type),
            )}
          >
            {tx._pairedWith ? (
              transferAmountDisplay(tx, tx._pairedWith)
            ) : (
              <>
                {tx.type === 'income' ? '+' : '-'} {tx.amount.toLocaleString()}{' '}
                {getTxCurrency(tx)}
              </>
            )}
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

        const attachmentCount = tx.attachments_count ?? 0;

        return (
          <div className='flex justify-end gap-2'>
            <Button
              size='sm'
              variant={attachmentCount > 0 ? 'soft-emerald' : 'soft-slate'}
              className='px-2'
              onClick={() => onAttachments(tx)}
              title={
                attachmentCount > 0
                  ? `${attachmentCount} comprobante${attachmentCount === 1 ? '' : 's'}`
                  : 'Adjuntar comprobante'
              }
            >
              <Paperclip className='w-4 h-4' />
              {attachmentCount > 0 && (
                <span className='ml-1 text-xs tabular-nums'>{attachmentCount}</span>
              )}
            </Button>
            {isEditable && tx.category && (
              <Button
                size='sm'
                variant='soft-slate'
                className='px-2'
                onClick={() => onCreateRule(tx)}
                title='Crear regla desde esta transacción'
              >
                <Tag className='w-4 h-4' />
              </Button>
            )}
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
