'use client';

import { useDebts } from '@/hooks/useDebts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { Debt } from '@/types';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';

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

  const getKindLabel = (kind: string) =>
    kind === 'credit_card' ? 'Tarjeta de Crédito' : 'Préstamo';
  const getKindBadgeVariant = (kind: string) =>
    kind === 'credit_card' ? 'secondary' : 'outline';

  const activeDebts = useMemo(
    () => debts.filter((d) => d.status === 'active'),
    [debts],
  );
  const closedDebts = useMemo(
    () => debts.filter((d) => d.status === 'closed'),
    [debts],
  );

  const isPristine = (d: Debt) => (d.transactions_count ?? 0) === 0;
  const canClose = (d: Debt) => d.status === 'active' && d.total_amount === 0;
  const canReopen = (d: Debt) => d.status === 'closed';

  const handleCloseDebt = async (debt: Debt) => {
    try {
      const res = await api.post(`/debts/${debt.id}/close`);
      toast.success(res.data?.message || 'Deuda cerrada correctamente');
      refresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error?.response?.data?.detail || 'No se pudo cerrar la deuda',
        );
      }
    }
  };

  const handleReopenDebt = async (debt: Debt) => {
    try {
      const res = await api.post(`/debts/${debt.id}/reopen`);
      toast.success(res.data?.message || 'Deuda reabierta correctamente');
      refresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error?.response?.data?.detail || 'No se pudo reabrir la deuda',
        );
      }
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h1 className='text-xl font-semibold'>Deudas</h1>
        <Button onClick={() => setCreateOpen(true)}>+ Nueva Deuda</Button>
      </div>

      {/* ACTIVAS */}
      <section className='space-y-3'>
        <h2 className='text-sm font-medium text-muted-foreground'>
          Deudas activas
        </h2>

        {loading ? (
          <p className='text-center p-4 text-muted-foreground'>
            Cargando deudas...
          </p>
        ) : activeDebts.length ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
            {activeDebts.map((debt) => (
              <Card
                key={debt.id}
                className='p-4 space-y-1 bg-card text-foreground border border-border rounded-md'
              >
                <div className='flex items-center justify-between'>
                  <p className='font-medium'>{debt.name}</p>
                  <Badge variant={getKindBadgeVariant(debt.kind)}>
                    {getKindLabel(debt.kind)}
                  </Badge>
                </div>

                <p className='text-sm text-muted-foreground'>
                  Saldo: {formatCurrency(debt.total_amount)} {debt.currency}
                </p>
                <p className='text-sm text-muted-foreground'>
                  Tasa de interés: {debt.interest_rate}%
                </p>
                {debt.due_date && (
                  <p className='text-sm text-muted-foreground'>
                    Vence: {format(new Date(debt.due_date), 'dd MMM yyyy')}
                  </p>
                )}
                <p className='text-sm'>
                  Estado:{' '}
                  <span className='text-green-600 font-medium'>Activa</span>
                </p>
                {isPristine(debt) && (
                  <p className='text-xs text-emerald-600'>
                    Deuda prístina (sin movimientos)
                  </p>
                )}

                <div className='flex flex-wrap gap-2 mt-2'>
                  {/* Acciones */}
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

                  {canClose(debt) && (
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={() => handleCloseDebt(debt)}
                    >
                      Cerrar
                    </Button>
                  )}

                  {/* Eliminar solo si no tiene transacciones de ningún tipo */}
                  {isPristine(debt) && (
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
          </div>
        ) : (
          <p className='text-center p-4 text-muted-foreground'>
            No tienes deudas activas.
          </p>
        )}
      </section>

      {/* CERRADAS */}
      <section className='space-y-3'>
        <h2 className='text-sm font-medium text-muted-foreground'>
          Deudas cerradas
        </h2>

        {loading ? (
          <p className='text-center p-4 text-muted-foreground'>
            Cargando deudas...
          </p>
        ) : closedDebts.length ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
            {closedDebts.map((debt) => (
              <Card
                key={debt.id}
                className='p-4 space-y-1 bg-muted/60 text-foreground border border-dashed rounded-md'
              >
                <div className='flex items-center justify-between'>
                  <p className='font-medium'>{debt.name}</p>
                  <Badge variant={getKindBadgeVariant(debt.kind)}>
                    {getKindLabel(debt.kind)}
                  </Badge>
                </div>

                <p className='text-sm text-muted-foreground'>
                  Saldo: {formatCurrency(debt.total_amount)} {debt.currency}
                </p>
                <p className='text-sm text-muted-foreground'>
                  Tasa de interés: {debt.interest_rate}%
                </p>
                {debt.due_date && (
                  <p className='text-sm text-muted-foreground'>
                    Vence: {format(new Date(debt.due_date), 'dd MMM yyyy')}
                  </p>
                )}
                <p className='text-sm text-amber-700'>Estado: Cerrada</p>

                <div className='flex flex-wrap gap-2 mt-2'>
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

                  {canReopen(debt) && (
                    <Button size='sm' onClick={() => handleReopenDebt(debt)}>
                      Reabrir
                    </Button>
                  )}

                  {/* Eliminar solo si no tiene transacciones de ningún tipo */}
                  {isPristine(debt) && (
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
          </div>
        ) : (
          <p className='text-center p-4 text-muted-foreground'>
            No tienes deudas cerradas.
          </p>
        )}
      </section>

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
