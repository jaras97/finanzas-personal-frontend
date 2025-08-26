'use client';

import { useMemo, useState } from 'react';
import { useDebts } from '@/hooks/useDebts';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';

import type { currencyType, Debt } from '@/types';

import NewDebtModal from '@/components/forms/NewDebtModal';
import EditDebtModal from '@/components/forms/EditDebtModal';
import DeleteDebtModal from '@/components/forms/DeleteDebtModal';
import PayDebtModal from '@/components/forms/PayDebtModal';
import AddChargeToDebtModal from '@/components/forms/AddChargeToDebtModal';
import DebtTransactionsModal from '@/components/forms/DebtTransactionsModal';
import DebtsSection from '@/components/debts/DebtsSection';
import KpiTotalsCard from '@/components/kpi/KpiTotalsCard';

// ==== helpers
type Currency = currencyType | string;

function sumByCurrency(items: Debt[]) {
  return items.reduce<Record<Currency, number>>((acc, d) => {
    acc[d.currency] = (acc[d.currency] || 0) + (d.total_amount || 0);
    return acc;
  }, {});
}

export default function DebtsPage() {
  const { debts, loading, refresh } = useDebts();

  // Modales
  const [createOpen, setCreateOpen] = useState(false);
  const [editDebt, setEditDebt] = useState<Debt | null>(null);
  const [deleteDebt, setDeleteDebt] = useState<Debt | null>(null);
  const [payDebt, setPayDebt] = useState<Debt | null>(null);
  const [addChargeDebt, setAddChargeDebt] = useState<Debt | null>(null);
  const [viewTransactionsDebt, setViewTransactionsDebt] = useState<Debt | null>(
    null,
  );

  // Agrupaciones
  const active = useMemo(
    () => debts.filter((d) => d.status === 'active'),
    [debts],
  );
  const closed = useMemo(
    () => debts.filter((d) => d.status === 'closed'),
    [debts],
  );

  const loans = useMemo(
    () => active.filter((d) => d.kind === 'loan'),
    [active],
  );
  const cards = useMemo(
    () => active.filter((d) => d.kind === 'credit_card'),
    [active],
  );

  // Totales por kind/currency
  const tLoans = useMemo(() => sumByCurrency(loans), [loans]);
  const tCards = useMemo(() => sumByCurrency(cards), [cards]);
  const tAll = useMemo(() => sumByCurrency(active), [active]);

  // Policy de acciones (igual que tenías, centralizada)
  function getDebtActions(d: Debt) {
    const txCount = d.transactions_count ?? 0;
    const isPristine = txCount === 0;
    const canClose = d.status === 'active' && d.total_amount === 0;
    const canReopen = d.status === 'closed';
    return { isPristine, canClose, canReopen };
  }

  async function handleCloseDebt(debt: Debt) {
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
  }
  async function handleReopenDebt(debt: Debt) {
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
  }

  return (
    <div className='space-y-6'>
      {/* Header + CTA */}
      <div className='flex justify-between items-center flex-wrap gap-2'>
        <div className='min-w-0'>
          <h1 className='text-2xl font-semibold'>Deudas</h1>
          <p className='text-sm text-muted-foreground'>
            Gestiona tus préstamos y tarjetas de crédito.
          </p>
        </div>
        <div className='flex gap-2 flex-wrap'>
          <Button onClick={() => setCreateOpen(true)} variant='soft-rose'>
            + Nueva deuda
          </Button>
        </div>
      </div>

      {/* KPIs (mismo patrón de Savings) */}
      <section className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
        <KpiTotalsCard
          title='Total en préstamos'
          totals={tLoans}
          gradient
          cardVariant='white'
        />
        <KpiTotalsCard
          title='Total en tarjetas de crédito'
          totals={tCards}
          gradient
          cardVariant='white'
        />

        {/* Total general: mejor neutra (surface) para pasivos */}
        <KpiTotalsCard
          title='Total general'
          totals={tAll}
          cardVariant='kpi-red'
        />
      </section>

      {/* 1) Préstamos */}
      <DebtsSection
        title='Préstamos'
        hint='Créditos de consumo, estudiantiles, personales, etc.'
        items={loans}
        loading={loading}
        emptyText='No tienes préstamos activos.'
        tone='loan'
        getDebtActions={getDebtActions}
        onPay={setPayDebt}
        onCharge={setAddChargeDebt}
        onViewTx={setViewTransactionsDebt}
        onEdit={setEditDebt}
        onClose={handleCloseDebt}
        onDelete={setDeleteDebt}
      />

      {/* 2) Tarjetas de crédito */}
      <DebtsSection
        title='Tarjetas de crédito'
        hint='Movimientos rotativos, pagos mínimos, etc.'
        items={cards}
        loading={loading}
        emptyText='No tienes tarjetas activas.'
        tone='credit'
        getDebtActions={getDebtActions}
        onPay={setPayDebt}
        onCharge={setAddChargeDebt}
        onViewTx={setViewTransactionsDebt}
        onEdit={setEditDebt}
        onClose={handleCloseDebt}
        onDelete={setDeleteDebt}
      />

      {/* 3) Cerradas */}
      <DebtsSection
        title='Deudas cerradas'
        hint='Se conservan para consulta histórica.'
        items={closed}
        loading={loading}
        emptyText='No tienes deudas cerradas.'
        tone='loan'
        closed
        getDebtActions={getDebtActions}
        onPay={() => {}}
        onCharge={() => {}}
        onViewTx={setViewTransactionsDebt}
        onEdit={setEditDebt}
        onClose={() => {}}
        onDelete={setDeleteDebt}
        onReopen={handleReopenDebt}
      />

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
          onOpenChange={(o) => !o && setEditDebt(null)}
        />
      )}

      {deleteDebt && (
        <DeleteDebtModal
          debt={deleteDebt}
          onDeleted={refresh}
          open={!!deleteDebt}
          onOpenChange={(o) => !o && setDeleteDebt(null)}
        />
      )}

      {payDebt && (
        <PayDebtModal
          debt={payDebt}
          onPaid={refresh}
          open={!!payDebt}
          onOpenChange={(o) => !o && setPayDebt(null)}
        />
      )}

      {addChargeDebt && (
        <AddChargeToDebtModal
          debt={addChargeDebt}
          onCompleted={refresh}
          open={!!addChargeDebt}
          onOpenChange={(o) => !o && setAddChargeDebt(null)}
        />
      )}

      {viewTransactionsDebt && (
        <DebtTransactionsModal
          debt={viewTransactionsDebt}
          open={!!viewTransactionsDebt}
          onOpenChange={(o) => !o && setViewTransactionsDebt(null)}
        />
      )}
    </div>
  );
}
