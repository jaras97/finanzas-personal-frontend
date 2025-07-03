'use client';

import { useSavingAccounts } from '@/hooks/useSavingAccounts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { SavingAccount } from '@/types';

import NewSavingAccountModal from '@/components/forms/NewSavingAccountModal';
import EditSavingAccountModal from '@/components/forms/EditSavingAccountModal';
import DeleteSavingAccountModal from '@/components/forms/DeleteSavingAccountModal';
import DepositToAccountModal from '@/components/forms/DepositToAccountModal';
import TransferBetweenAccountsModal from '@/components/forms/TransferBetweenAccountsModal';
import RegisterYieldModal from '@/components/forms/RegisterYieldModal';
import AccountTransactionsModal from '@/components/forms/AccountTransactionsModal'; // ✅ NUEVO

import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import api from '@/lib/api';

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
    useState<SavingAccount | null>(null); // ✅ NUEVO

  const handleCloseAccount = async (account: SavingAccount) => {
    try {
      const res = await api.post(`/saving-accounts/${account.id}/close`);
      toast.success(res.data.message || 'Cuenta cerrada correctamente');
      refresh();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || 'No se pudo cerrar la cuenta',
      );
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h1 className='text-xl font-semibold'>Cuentas</h1>
        <div className='flex gap-2'>
          <Button onClick={() => setTransferOpen(true)}>
            Transferir entre cuentas
          </Button>
          <Button onClick={() => setCreateOpen(true)}>+ Nueva Cuenta</Button>
        </div>
      </div>

      {loading ? (
        <p className='text-center p-4'>Cargando cuentas...</p>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
          {accounts.map((account) => (
            <Card key={account.id} className='p-4 space-y-1'>
              <p className='font-medium'>{account.name}</p>
              <p className='text-gray-500 text-sm'>
                Saldo: {formatCurrency(account.balance)} {account.currency}
              </p>
              <p className='text-gray-500 text-sm capitalize'>
                Tipo:{' '}
                {account.type === 'cash'
                  ? 'Efectivo'
                  : account.type === 'bank'
                  ? 'Banco'
                  : 'Inversión'}
              </p>
              <p className='text-gray-500 text-sm'>
                Estado: {account.status === 'active' ? 'Activa' : 'Cerrada'}
              </p>
              <div className='flex flex-wrap gap-2 mt-2'>
                <Button
                  size='sm'
                  variant='secondary'
                  onClick={() => setViewTransactionsAccount(account)}
                >
                  Ver movimientos
                </Button>
                {account.status === 'active' && (
                  <>
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
                        variant='default'
                        onClick={() => setYieldAccount(account)}
                      >
                        Agregar rendimiento
                      </Button>
                    )}
                    {account.balance === 0 && (
                      <Button
                        size='sm'
                        variant='destructive'
                        onClick={() => handleCloseAccount(account)}
                      >
                        Cerrar
                      </Button>
                    )}
                  </>
                )}
                {account.balance === 0 && account.status === 'closed' && (
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
          ))}
          {accounts.length === 0 && (
            <p className='text-center p-4 text-gray-500'>
              No tienes cuentas registradas.
            </p>
          )}
        </div>
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
