'use client';

import { useDebts } from '@/hooks/useDebts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import { useState } from 'react';
import { Debt } from '@/types';

import NewDebtModal from '@/components/forms/NewDebtModal';
import EditDebtModal from '@/components/forms/EditDebtModal';
import DeleteDebtModal from '@/components/forms/DeleteDebtModal';
import PayDebtModal from '@/components/forms/PayDebtModal';
import AddChargeToDebtModal from '@/components/forms/AddChargeToDebtModal';
import DebtTransactionsModal from '@/components/forms/DebtTransactionsModal';

export default function DebtsPage() {
  const { debts, loading, refresh } = useDebts();

  const [createOpen, setCreateOpen] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [deleteDebt, setDeleteDebt] = useState<Debt | null>(null);
  const [payDebt, setPayDebt] = useState<Debt | null>(null);
  const [addChargeDebt, setAddChargeDebt] = useState<Debt | null>(null);
  const [viewTransactionsDebt, setViewTransactionsDebt] = useState<Debt | null>(
    null,
  );

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h1 className='text-xl font-semibold'>Deudas</h1>
        <Button onClick={() => setCreateOpen(true)}>+ Nueva Deuda</Button>
      </div>

      {loading ? (
        <p className='text-center p-4'>Cargando deudas...</p>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
          {debts.map((debt) => (
            <Card key={debt.id} className='p-4 space-y-1'>
              <p className='font-medium'>{debt.name}</p>
              <p className='text-gray-500 text-sm'>
                Saldo: {formatCurrency(debt.total_amount)} {debt.currency}
              </p>
              <p className='text-gray-500 text-sm'>
                Tasa de interés: {debt.interest_rate}%
              </p>
              {debt.due_date && (
                <p className='text-gray-500 text-sm'>
                  Vence: {format(new Date(debt.due_date), 'dd MMM yyyy')}
                </p>
              )}
              <p className='text-gray-500 text-sm'>
                Estado:{' '}
                {debt.status === 'active' ? (
                  <span className='text-green-600 font-medium'>Activa</span>
                ) : (
                  <span className='text-gray-600'>Cerrada</span>
                )}
              </p>
              <div className='flex flex-wrap gap-2 mt-2'>
                {debt.status === 'active' && (
                  <>
                    <Button size='sm' onClick={() => setPayDebt(debt)}>
                      Pagar
                    </Button>
                    <Button
                      size='sm'
                      variant='secondary'
                      onClick={() => setAddChargeDebt(debt)}
                    >
                      Agregar Cargo
                    </Button>
                  </>
                )}
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setViewTransactionsDebt(debt)}
                >
                  Ver Movimientos
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setEditDebt(debt)}
                >
                  Editar
                </Button>
                {debt.total_amount === 0 && (
                  <Button
                    size='sm'
                    variant='destructive'
                    onClick={() => setDeleteDebt(debt)}
                  >
                    Eliminar
                  </Button>
                )}
              </div>
            </Card>
          ))}
          {debts.length === 0 && (
            <p className='text-center p-4 text-gray-500'>
              No tienes deudas registradas.
            </p>
          )}
        </div>
      )}

      {/* Modales */}
      <NewDebtModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={refresh}
      />
      {editDebt && (
        <EditDebtModal
          debt={editDebt}
          onUpdated={refresh}
          open={!!editDebt}
          onOpenChange={(open) => !open && setEditDebt(null)}
        />
      )}
      {deleteDebt && (
        <DeleteDebtModal
          debt={deleteDebt}
          onDeleted={refresh}
          open={!!deleteDebt}
          onOpenChange={(open) => !open && setDeleteDebt(null)}
        />
      )}
      {payDebt && (
        <PayDebtModal
          debt={payDebt}
          onPaid={refresh}
          open={!!payDebt}
          onOpenChange={(open) => !open && setPayDebt(null)}
        />
      )}
      {addChargeDebt && (
        <AddChargeToDebtModal
          debt={addChargeDebt}
          onCompleted={refresh}
          open={!!addChargeDebt}
          onOpenChange={(open) => !open && setAddChargeDebt(null)}
        />
      )}
      {viewTransactionsDebt && (
        <DebtTransactionsModal
          debt={viewTransactionsDebt}
          open={!!viewTransactionsDebt}
          onOpenChange={(open) => !open && setViewTransactionsDebt(null)}
        />
      )}
    </div>
  );
}
