'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import type { SavingAccount } from '@/types';

type Tone = 'cash' | 'bank' | 'investment';

const toneMap: Record<Tone, { solid: string; outline: string }> = {
  cash: {
    solid:
      'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-300',
    outline:
      'border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-50/80',
  },
  bank: {
    solid: 'bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-300',
    outline:
      'border-sky-300 text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-50/80',
  },
  investment: {
    solid:
      'bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-300',
    outline:
      'border-violet-300 text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-50/80',
  },
};

const toneBorderMap: Record<Tone, string> = {
  cash: 'border-emerald-200 dark:border-emerald-700',
  bank: 'border-sky-200 dark:border-sky-700',
  investment: 'border-violet-200 dark:border-violet-700',
};

export type AccountsSectionProps = {
  title: string;
  hint?: string;
  loading: boolean;
  emptyText: string;
  items: SavingAccount[];
  getAccountActions: (a: SavingAccount) => {
    hasTx: boolean | undefined;
    isPristine: boolean;
    canDelete: boolean;
    canClose: boolean;
    canReopen: boolean;
    canEditAll: boolean;
    canEditNameOnly: boolean;
  };
  onViewTx: (a: SavingAccount) => void;
  onDeposit: (a: SavingAccount) => void;
  onEdit: (a: SavingAccount) => void;
  onYield: (a: SavingAccount) => void;
  onClose: (a: SavingAccount) => void;
  onDelete: (a: SavingAccount) => void;
  showYield?: boolean;
  tone: Tone;
  className?: string; // 👉 para estilizar la <section>
  cardClassName?: string; // 👉 para estilizar cada Card
};

export default function AccountsSection({
  title,
  hint,
  loading,
  emptyText,
  items,
  getAccountActions,
  onViewTx,
  onDeposit,
  onEdit,
  onYield,
  onClose,
  onDelete,
  showYield = false,
  tone,
  className,
  cardClassName,
}: AccountsSectionProps) {
  const t = toneMap[tone];

  return (
    <section className={cn('space-y-3', className)}>
      <header className='flex items-center justify-between'>
        <div>
          <h2 className='text-sm font-medium text-muted-foreground'>{title}</h2>
          {hint && <p className='text-xs text-muted-foreground/80'>{hint}</p>}
        </div>
      </header>

      {loading ? (
        <p className='text-center p-4'>Cargando cuentas...</p>
      ) : items.length ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
          {items.map((account) => {
            const actions = getAccountActions(account);
            return (
              <Card
                key={account.id}
                variant='white' // 👈 usa tu variante blanca del Card
                className={cn(
                  'p-4 flex flex-col justify-between space-y-2 border shadow-sm',
                  'text-slate-900', // alto contraste
                  toneBorderMap[tone], // borde según tipo
                  cardClassName,
                )}
              >
                <div className='space-y-1'>
                  <p className='font-medium'>{account.name}</p>
                  <p className='text-sm/6 text-slate-600'>
                    Saldo: {formatCurrency(account.balance)} {account.currency}
                  </p>
                  <p className='text-xs/5 text-slate-500'>
                    {account.status === 'active' ? 'Activa' : 'Cerrada'}
                  </p>
                  {actions.isPristine && (
                    <p className='text-xs font-medium text-emerald-700'>
                      Cuenta prístina (sin movimientos)
                    </p>
                  )}
                </div>

                <div className='flex flex-wrap gap-2 mt-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    className={t.outline}
                    onClick={() => onViewTx(account)}
                  >
                    Ver movimientos
                  </Button>

                  {/* <Button
                    size='sm'
                    className={t.solid}
                    onClick={() => onDeposit(account)}
                  >
                    Depositar
                  </Button> */}

                  <Button
                    size='sm'
                    variant='outline'
                    className={t.outline}
                    onClick={() => onEdit(account)}
                  >
                    Editar
                  </Button>

                  {showYield && (
                    <Button
                      size='sm'
                      className={toneMap.investment.solid}
                      onClick={() => onYield(account)}
                    >
                      Agregar rendimiento
                    </Button>
                  )}

                  {actions.canClose && (
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={() => onClose(account)}
                    >
                      Cerrar
                    </Button>
                  )}

                  {actions.canDelete && (
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={() => onDelete(account)}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className='text-center p-4 text-muted-foreground'>{emptyText}</p>
      )}
    </section>
  );
}
