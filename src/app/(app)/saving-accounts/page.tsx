'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSavingAccounts } from '@/hooks/useSavingAccounts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { currencyType, SavingAccount } from '@/types';

import NewSavingAccountModal from '@/components/forms/NewSavingAccountModal';
import EditSavingAccountModal from '@/components/forms/EditSavingAccountModal';
import DeleteSavingAccountModal from '@/components/forms/DeleteSavingAccountModal';
import DepositToAccountModal from '@/components/forms/DepositToAccountModal';
import TransferBetweenAccountsModal from '@/components/forms/TransferBetweenAccountsModal';
import RegisterYieldModal from '@/components/forms/RegisterYieldModal';
import AccountTransactionsModal from '@/components/forms/AccountTransactionsModal';

import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';
import { cn } from '@/lib/utils';
import AccountsSection from '@/components/accounts/AccountsSection';
import KpiTotalsCard from '@/components/kpi/KpiTotalsCard';
import {
  AccountsSectionSkeleton,
  ClosedAccountsSkeleton,
  SavingAccountsHeaderButtonsSkeleton,
  SavingAccountsKpisSkeleton,
} from '@/components/skeletons/SavingAccountsSkeleton';

// ===== helpers
type HasTxMap = Record<number, boolean>;
type Currency = currencyType | string;

function sumByCurrency(items: SavingAccount[]) {
  return items.reduce<Record<Currency, number>>((acc, a) => {
    acc[a.currency] = (acc[a.currency] || 0) + (a.balance || 0);
    return acc;
  }, {});
}

// ===== tonos por tipo de cuenta
const toneMap = {
  cash: {
    card: 'bg-emerald-50 border-emerald-200 text-emerald-950 dark:bg-emerald-950/25 dark:border-emerald-900/60 dark:text-emerald-100',
    solid:
      'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-300',
    outline:
      'border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-200 dark:hover:bg-emerald-950/40',
    secondary:
      'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-100',
  },
  bank: {
    card: 'bg-sky-50 border-sky-200 text-sky-950 dark:bg-sky-950/25 dark:border-sky-900/60 dark:text-sky-100',
    solid: 'bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-300',
    outline:
      'border-sky-300 text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:text-sky-200 dark:hover:bg-sky-950/40',
    secondary:
      'bg-sky-100 text-sky-900 hover:bg-sky-200 dark:bg-sky-900/50 dark:text-sky-100',
  },
  investment: {
    card: 'bg-violet-50 border-violet-200 text-violet-950 dark:bg-violet-950/25 dark:border-violet-900/60 dark:text-violet-100',
    solid:
      'bg-violet-600 text-white hover:bg-violet-700 focus-visible:ring-violet-300',
    outline:
      'border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:text-violet-200 dark:hover:bg-violet-950/40',
    secondary:
      'bg-violet-100 text-violet-900 hover:bg-violet-200 dark:bg-violet-900/50 dark:text-violet-100',
  },
  closed: {
    card: 'bg-slate-50 border-slate-200 text-slate-950 dark:bg-slate-900/40 dark:border-slate-800 dark:text-slate-100',
    solid: 'bg-slate-600 text-white hover:bg-slate-700',
    outline:
      'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/50',
    secondary:
      'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-100',
  },
};

export default function SavingAccountsPage() {
  const { accounts, loading, refresh } = useSavingAccounts();

  // Modales
  const [createOpen, setCreateOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<SavingAccount | null>(null);
  const [deleteAccount, setDeleteAccount] = useState<SavingAccount | null>(
    null,
  );
  const [depositAccount, setDepositAccount] = useState<SavingAccount | null>(
    null,
  );
  const [yieldAccount, setYieldAccount] = useState<SavingAccount | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [viewTransactionsAccount, setViewTransactionsAccount] =
    useState<SavingAccount | null>(null);

  // Cache local: si la cuenta tiene movimientos
  const [hasTxMap, setHasTxMap] = useState<HasTxMap>({});

  useEffect(() => {
    if (!accounts.length) return;
    const pending = accounts
      .filter((a) => hasTxMap[a.id] === undefined)
      .map((a) => a.id);
    if (!pending.length) return;
    (async () => {
      try {
        const results = await Promise.all(
          pending.map(async (id) => {
            const res = await api.get(
              `/saving-accounts/${id}/has-transactions`,
            );
            return [id, Boolean(res.data?.hasTransactions)] as const;
          }),
        );
        setHasTxMap((prev) => ({ ...prev, ...Object.fromEntries(results) }));
      } catch {
        /* noop */
      }
    })();
  }, [accounts, hasTxMap]);

  async function handleCloseAccount(account: SavingAccount) {
    try {
      const res = await api.post(`/saving-accounts/${account.id}/close`);
      toast.success(res.data.message || 'Cuenta cerrada correctamente');
      refresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error?.response?.data?.detail || 'No se pudo cerrar la cuenta',
        );
      }
    }
  }
  async function handleReopenAccount(account: SavingAccount) {
    try {
      const res = await api.post(`/saving-accounts/${account.id}/reopen`);
      toast.success(res.data.message || 'Cuenta reabierta correctamente');
      refresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error?.response?.data?.detail || 'No se pudo reabrir la cuenta',
        );
      }
    }
  }

  function getAccountActions(acc: SavingAccount) {
    const hasTx = hasTxMap[acc.id];
    const isPristine = hasTx === false;
    const canDelete = isPristine && acc.status === 'active';
    const canClose = acc.status === 'active' && acc.balance === 0;
    const canReopen = acc.status === 'closed';
    const canEditAll = isPristine;
    const canEditNameOnly = hasTx === true;
    return {
      hasTx,
      isPristine,
      canDelete,
      canClose,
      canReopen,
      canEditAll,
      canEditNameOnly,
    };
  }

  // Agrupaciones
  const active = useMemo(
    () => accounts.filter((a) => a.status === 'active'),
    [accounts],
  );
  const closed = useMemo(
    () => accounts.filter((a) => a.status === 'closed'),
    [accounts],
  );

  const cash = useMemo(() => active.filter((a) => a.type === 'cash'), [active]);
  const bank = useMemo(() => active.filter((a) => a.type === 'bank'), [active]);
  const invest = useMemo(
    () => active.filter((a) => a.type === 'investment'),
    [active],
  );

  // Totales por tipo/currency
  const tCash = useMemo(() => sumByCurrency(cash), [cash]);
  const tBank = useMemo(() => sumByCurrency(bank), [bank]);
  const tInvest = useMemo(() => sumByCurrency(invest), [invest]);
  const tAll = useMemo(() => sumByCurrency(active), [active]);

  return (
    <div className='space-y-6'>
      {/* Header acciones */}
      <div className='flex justify-between items-center flex-wrap gap-2'>
        <div className='min-w-0'>
          <h1 className='text-2xl font-semibold'>Cuentas</h1>
          <p className='text-sm text-muted-foreground'>
            Administra tus cuentas y movimientos.
          </p>
        </div>
        {loading ? (
          <SavingAccountsHeaderButtonsSkeleton />
        ) : (
          <div className='flex gap-2 flex-wrap'>
            <Button
              onClick={() => setTransferOpen(true)}
              variant={'soft-emerald'}
            >
              Transferir entre cuentas
            </Button>
            <Button onClick={() => setCreateOpen(true)} variant={'soft-sky'}>
              + Nueva Cuenta
            </Button>
          </div>
        )}
      </div>

      {/* KPIs */}
      {loading ? (
        <SavingAccountsKpisSkeleton />
      ) : (
        <section className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <KpiTotalsCard
            title='Total en efectivo'
            totals={tCash}
            gradient
            cardVariant='kpi-balance'
          />
          <KpiTotalsCard
            title='Total en cuentas bancarias'
            totals={tBank}
            gradient
            cardVariant='white'
          />
          <KpiTotalsCard
            title='Total en inversión'
            totals={tInvest}
            gradient
            cardVariant='white'
          />
          <KpiTotalsCard
            title='Total general'
            totals={tAll}
            cardVariant='kpi-green'
          />
        </section>
      )}

      {/* 2) Efectivo */}
      {loading ? (
        <>
          <header className='space-y-1'>
            <h2 className='text-sm font-medium text-muted-foreground'>
              Cuentas de efectivo
            </h2>
            <p className='text-xs text-muted-foreground/80'>
              Billetes/monedas en caja o billeteras.
            </p>
          </header>
          <AccountsSectionSkeleton tone='cash' items={3} />
        </>
      ) : (
        <AccountsSection
          title='Cuentas de efectivo'
          hint='Billetes/monedas en caja o billeteras.'
          loading={loading}
          emptyText='No tienes cuentas de efectivo.'
          items={cash}
          getAccountActions={getAccountActions}
          onViewTx={setViewTransactionsAccount}
          onDeposit={setDepositAccount}
          onEdit={setEditAccount}
          onYield={setYieldAccount}
          onClose={handleCloseAccount}
          onDelete={setDeleteAccount}
          showYield={false}
          tone='cash'
        />
      )}

      {/* 3) Bancarias */}
      {loading ? (
        <>
          <header className='space-y-1'>
            <h2 className='text-sm font-medium text-muted-foreground'>
              Cuentas bancarias
            </h2>
            <p className='text-xs text-muted-foreground/80'>
              Cuentas corrientes/ahorro.
            </p>
          </header>
          <AccountsSectionSkeleton tone='bank' items={3} />
        </>
      ) : (
        <AccountsSection
          title='Cuentas bancarias'
          hint='Cuentas corrientes/ahorro.'
          loading={loading}
          emptyText='No tienes cuentas bancarias.'
          items={bank}
          getAccountActions={getAccountActions}
          onViewTx={setViewTransactionsAccount}
          onDeposit={setDepositAccount}
          onEdit={setEditAccount}
          onYield={setYieldAccount}
          onClose={handleCloseAccount}
          onDelete={setDeleteAccount}
          showYield={false}
          tone='bank'
        />
      )}

      {/* 4) Inversión */}
      {loading ? (
        <>
          <header className='space-y-1'>
            <h2 className='text-sm font-medium text-muted-foreground'>
              Cuentas de inversión
            </h2>
            <p className='text-xs text-muted-foreground/80'>
              Fondos, brókers o productos con rendimiento.
            </p>
          </header>
          <AccountsSectionSkeleton tone='investment' items={3} />
        </>
      ) : (
        <AccountsSection
          title='Cuentas de inversión'
          hint='Fondos, brókers o productos con rendimiento.'
          loading={loading}
          emptyText='No tienes cuentas de inversión.'
          items={invest}
          getAccountActions={getAccountActions}
          onViewTx={setViewTransactionsAccount}
          onDeposit={setDepositAccount}
          onEdit={setEditAccount}
          onYield={setYieldAccount}
          onClose={handleCloseAccount}
          onDelete={setDeleteAccount}
          showYield
          tone='investment'
        />
      )}

      {/* 5) Cerradas */}
      {loading ? (
        <ClosedAccountsSkeleton items={3} />
      ) : (
        <section className='space-y-3'>
          <header className='flex items-center justify-between'>
            <div>
              <h2 className='text-sm font-medium text-muted-foreground'>
                Cuentas cerradas
              </h2>
              <p className='text-xs text-muted-foreground/80'>
                Se mantienen para historial; puedes reabrirlas.
              </p>
            </div>
          </header>

          {loading ? (
            <p className='text-center p-4'>Cargando cuentas...</p>
          ) : closed.length ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
              {closed.map((account) => (
                <Card
                  key={account.id}
                  className={cn(
                    'p-4 flex flex-col justify-between space-y-2 border',
                    toneMap.closed.card,
                  )}
                  variant='white'
                >
                  <div className='space-y-1'>
                    <p className='font-medium'>{account.name}</p>
                    <p className='text-sm opacity-80'>
                      Saldo: {formatCurrency(account.balance)}{' '}
                      {account.currency}
                    </p>
                    <p className='text-sm text-amber-700'>Estado: Cerrada</p>
                  </div>
                  <div className='flex flex-wrap gap-2 mt-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      className={toneMap.closed.outline}
                      onClick={() => setViewTransactionsAccount(account)}
                    >
                      Ver movimientos
                    </Button>
                    <Button
                      size='sm'
                      className={toneMap.closed.solid}
                      onClick={() => handleReopenAccount(account)}
                    >
                      Reabrir
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className='text-center p-4 text-muted-foreground'>
              No tienes cuentas cerradas.
            </p>
          )}
        </section>
      )}

      {/* Modales */}
      <NewSavingAccountModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={refresh}
      />
      {editAccount && (
        <EditSavingAccountModal
          account={editAccount}
          onUpdated={refresh}
          open={!!editAccount}
          onOpenChange={(open) => !open && setEditAccount(null)}
        />
      )}
      {deleteAccount && (
        <DeleteSavingAccountModal
          account={deleteAccount}
          onDeleted={refresh}
          open={!!deleteAccount}
          onOpenChange={(open) => !open && setDeleteAccount(null)}
        />
      )}
      {depositAccount && (
        <DepositToAccountModal
          account={depositAccount}
          onCompleted={refresh}
          open={!!depositAccount}
          onOpenChange={(open) => !open && setDepositAccount(null)}
        />
      )}
      {transferOpen && (
        <TransferBetweenAccountsModal
          open={transferOpen}
          onOpenChange={setTransferOpen}
          accounts={accounts}
          onTransferred={refresh}
        />
      )}
      {yieldAccount && (
        <RegisterYieldModal
          account={yieldAccount}
          onCompleted={refresh}
          open={!!yieldAccount}
          onOpenChange={(open) => !open && setYieldAccount(null)}
        />
      )}
      {viewTransactionsAccount && (
        <AccountTransactionsModal
          accountId={viewTransactionsAccount.id}
          open={!!viewTransactionsAccount}
          onOpenChange={(open) => !open && setViewTransactionsAccount(null)}
        />
      )}
    </div>
  );
}
