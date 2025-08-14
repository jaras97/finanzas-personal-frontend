'use client';

import { useSavingAccounts } from '@/hooks/useSavingAccounts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useEffect, useMemo, useState } from 'react';
import { SavingAccount } from '@/types';

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

type HasTxMap = Record<number, boolean>;

export default function SavingAccountsPage() {
  const { accounts, loading, refresh } = useSavingAccounts();

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

  // Cache local de si la cuenta tiene movimientos
  const [hasTxMap, setHasTxMap] = useState<HasTxMap>({});

  // Cargar has-transactions para cuentas sin resolver aún
  useEffect(() => {
    if (!accounts.length) return;
    const pending = accounts
      .filter((a) => hasTxMap[a.id] === undefined)
      .map((a) => a.id);
    if (pending.length === 0) return;

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
        // No bloqueamos la UI; el botón Eliminar simplemente no aparecerá si falla esta carga.
      }
    })();
  }, [accounts, hasTxMap]);

  const handleCloseAccount = async (account: SavingAccount) => {
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
  };

  const handleReopenAccount = async (account: SavingAccount) => {
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
  };

  // Policy: centralizamos lógica en un sitio
  function getAccountActions(acc: SavingAccount) {
    const hasTx = hasTxMap[acc.id]; // true/false/undefined(cargando)
    const isPristine = hasTx === false; // solo si tenemos confirmación de false
    const canDelete = isPristine && acc.status === 'active'; // eliminar solo prístina y activa
    const canClose = acc.status === 'active' && acc.balance === 0;
    const canReopen = acc.status === 'closed';
    const canEditAll = isPristine; // editar todo (tipo/moneda/nombre)
    const canEditNameOnly = hasTx === true; // si tiene movimientos, solo nombre
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

  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.status === 'active'),
    [accounts],
  );
  const closedAccounts = useMemo(
    () => accounts.filter((a) => a.status === 'closed'),
    [accounts],
  );

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center flex-wrap gap-2'>
        <h1 className='text-xl font-semibold'>Cuentas</h1>
        <div className='flex gap-2 flex-wrap'>
          <Button onClick={() => setTransferOpen(true)}>
            Transferir entre cuentas
          </Button>
          <Button onClick={() => setCreateOpen(true)}>+ Nueva Cuenta</Button>
        </div>
      </div>

      {/* ACTIVAS */}
      <section className='space-y-3'>
        <h2 className='text-sm font-medium text-muted-foreground'>
          Cuentas activas
        </h2>
        {loading ? (
          <p className='text-center p-4'>Cargando cuentas...</p>
        ) : activeAccounts.length ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
            {activeAccounts.map((account) => {
              const actions = getAccountActions(account);
              return (
                <Card
                  key={account.id}
                  className='p-4 flex flex-col justify-between bg-card text-foreground space-y-2'
                >
                  <div className='space-y-1'>
                    <p className='font-medium'>{account.name}</p>
                    <p className='text-sm text-muted-foreground'>
                      Saldo: {formatCurrency(account.balance)}{' '}
                      {account.currency}
                    </p>
                    <p className='text-sm text-muted-foreground capitalize'>
                      Tipo:{' '}
                      {account.type === 'cash'
                        ? 'Efectivo'
                        : account.type === 'bank'
                        ? 'Banco'
                        : 'Inversión'}
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      Estado: Activa
                    </p>
                    {actions.isPristine && (
                      <p className='text-xs text-emerald-600'>
                        Cuenta prístina (sin movimientos)
                      </p>
                    )}
                  </div>

                  <div className='flex flex-wrap gap-2 mt-2'>
                    <Button
                      size='sm'
                      variant='secondary'
                      onClick={() => setViewTransactionsAccount(account)}
                    >
                      Ver movimientos
                    </Button>

                    <Button
                      size='sm'
                      onClick={() => setDepositAccount(account)}
                    >
                      Depositar
                    </Button>

                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => setEditAccount(account)}
                    >
                      Editar
                    </Button>

                    {account.type === 'investment' && (
                      <Button
                        size='sm'
                        onClick={() => setYieldAccount(account)}
                      >
                        Agregar rendimiento
                      </Button>
                    )}

                    {actions.canClose && (
                      <Button
                        size='sm'
                        variant='destructive'
                        onClick={() => handleCloseAccount(account)}
                      >
                        Cerrar
                      </Button>
                    )}

                    {/* Mostrar Eliminar solo si sabemos que es prístina y está activa */}
                    {actions.canDelete && (
                      <Button
                        size='sm'
                        variant='destructive'
                        onClick={() => setDeleteAccount(account)}
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
          <p className='text-center p-4 text-muted-foreground'>
            No tienes cuentas activas.
          </p>
        )}
      </section>

      {/* CERRADAS */}
      <section className='space-y-3'>
        <h2 className='text-sm font-medium text-muted-foreground'>
          Cuentas cerradas
        </h2>
        {loading ? (
          <p className='text-center p-4'>Cargando cuentas...</p>
        ) : closedAccounts.length ? (
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
            {closedAccounts.map((account) => (
              <Card
                key={account.id}
                className='p-4 flex flex-col justify-between bg-muted/60 text-foreground border-dashed space-y-2'
              >
                <div className='space-y-1'>
                  <p className='font-medium'>{account.name}</p>
                  <p className='text-sm text-muted-foreground'>
                    Saldo: {formatCurrency(account.balance)} {account.currency}
                  </p>
                  <p className='text-sm text-muted-foreground capitalize'>
                    Tipo:{' '}
                    {account.type === 'cash'
                      ? 'Efectivo'
                      : account.type === 'bank'
                      ? 'Banco'
                      : 'Inversión'}
                  </p>
                  <p className='text-sm text-amber-700'>Estado: Cerrada</p>
                </div>

                <div className='flex flex-wrap gap-2 mt-2'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => setViewTransactionsAccount(account)}
                  >
                    Ver movimientos
                  </Button>

                  {/* Reabrir (no se puede eliminar una vez cerrada) */}
                  <Button
                    size='sm'
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
