'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import TransactionsTabs from '@/components/layout/TransactionsTabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import axios from 'axios';
import { formatCurrency } from '@/lib/format';
import { formatDateInUserTimeZone } from '@/lib/formatDate';
import { useRecurringTransactions } from '@/hooks/useRecurringTransactions';
import RecurringTransactionModal from '@/components/forms/RecurringTransactionModal';
import type { RecurrenceFrequency, RecurringTransaction } from '@/types';
import { Repeat, Play, Pause, Pencil, Trash2 } from 'lucide-react';

const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  weekly: 'Cada semana',
  biweekly: 'Cada 2 semanas',
  monthly: 'Cada mes',
  yearly: 'Cada año',
};

export default function RecurringPage() {
  const { items, loading, refresh } = useRecurringTransactions();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [running, setRunning] = useState(false);

  const active = items.filter((r) => r.is_active);
  const paused = items.filter((r) => !r.is_active);

  const handleRun = async () => {
    setRunning(true);
    try {
      const { data } = await api.post('/recurring-transactions/run');
      if (data.total_created > 0) {
        toast.success(
          `Se registraron ${data.total_created} ${
            data.total_created === 1 ? 'movimiento' : 'movimientos'
          }.`,
        );
      } else if (data.skipped.length === 0) {
        toast.info('No hay movimientos pendientes por registrar.');
      }
      // Los omitidos importan más que los generados: son los que el usuario
      // debe resolver (típicamente saldo insuficiente).
      data.skipped?.forEach((s: { description: string; reason: string }) =>
        toast.warning(`${s.description}: ${s.reason}`, { duration: 8000 }),
      );
      refresh();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error?.response?.data?.detail || 'No se pudieron generar los movimientos'
          : 'Error inesperado',
      );
    } finally {
      setRunning(false);
    }
  };

  const handleToggle = async (r: RecurringTransaction) => {
    setBusyId(r.id);
    try {
      await api.put(`/recurring-transactions/${r.id}`, { is_active: !r.is_active });
      toast.success(r.is_active ? 'Recurrencia pausada' : 'Recurrencia reactivada');
      refresh();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error?.response?.data?.detail || 'No se pudo actualizar'
          : 'Error inesperado',
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (r: RecurringTransaction) => {
    if (
      !window.confirm(
        `¿Eliminar "${r.description}"? Dejará de registrarse automáticamente. Los movimientos que ya generó se conservan.`,
      )
    )
      return;
    setBusyId(r.id);
    try {
      await api.delete(`/recurring-transactions/${r.id}`);
      toast.success('Recurrencia eliminada');
      refresh();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error?.response?.data?.detail || 'No se pudo eliminar'
          : 'Error inesperado',
      );
    } finally {
      setBusyId(null);
    }
  };

  const Row = ({ r }: { r: RecurringTransaction }) => {
    const isOverdue =
      r.is_active && new Date(r.next_run + 'T12:00:00') <= new Date();
    return (
      <Card
        variant='white'
        className='p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'
      >
        <div className='min-w-0'>
          <div className='flex items-center gap-2 flex-wrap'>
            <p className='font-medium truncate'>{r.description}</p>
            <Badge
              variant='outline'
              className={cn(
                'w-fit',
                r.type === 'income'
                  ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                  : 'border-rose-300 text-rose-700 bg-rose-50',
              )}
            >
              {r.type === 'income' ? 'Ingreso' : 'Egreso'}
            </Badge>
            {!r.is_active && (
              <Badge variant='secondary' className='w-fit'>
                Pausada
              </Badge>
            )}
            {isOverdue && (
              <Badge
                variant='outline'
                className='w-fit border-amber-300 text-amber-700 bg-amber-50'
              >
                Pendiente por registrar
              </Badge>
            )}
          </div>

          <p className='mt-1 text-lg font-semibold tabular-nums'>
            {formatCurrency(r.amount, r.account_currency ?? 'COP')}
          </p>

          <p className='text-xs text-muted-foreground mt-0.5'>
            {FREQUENCY_LABELS[r.frequency]} · {r.account_name} · {r.category_name}
          </p>
          <p className='text-xs text-muted-foreground'>
            {r.is_active ? 'Próximo' : 'Pausada en'}:{' '}
            {formatDateInUserTimeZone(r.next_run + 'T12:00:00')}
            {r.end_date &&
              ` · finaliza el ${formatDateInUserTimeZone(r.end_date + 'T12:00:00')}`}
          </p>
        </div>

        <div className='flex gap-2 flex-wrap shrink-0'>
          <Button
            size='sm'
            variant='soft-slate'
            disabled={busyId === r.id}
            onClick={() => handleToggle(r)}
            title={r.is_active ? 'Pausar' : 'Reactivar'}
          >
            {r.is_active ? (
              <>
                <Pause className='h-4 w-4 mr-1' /> Pausar
              </>
            ) : (
              <>
                <Play className='h-4 w-4 mr-1' /> Reactivar
              </>
            )}
          </Button>
          <Button
            size='sm'
            variant='soft-sky'
            disabled={busyId === r.id}
            onClick={() => {
              setEditing(r);
              setModalOpen(true);
            }}
          >
            <Pencil className='h-4 w-4 mr-1' /> Editar
          </Button>
          <Button
            size='sm'
            variant='soft-rose'
            disabled={busyId === r.id}
            onClick={() => handleDelete(r)}
          >
            <Trash2 className='h-4 w-4 mr-1' /> Eliminar
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Movimientos recurrentes'
        subtitle='Nómina, arriendo, suscripciones: se registran solos según su frecuencia.'
        actions={
          <div className='flex gap-2 flex-wrap'>
            <Button variant='soft-slate' onClick={handleRun} disabled={running || loading}>
              <Repeat className='h-4 w-4 mr-1' />
              {running ? 'Registrando…' : 'Registrar pendientes'}
            </Button>
            <Button
              variant='soft-sky'
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              + Nueva recurrencia
            </Button>
          </div>
        }
      />
      <TransactionsTabs />

      {loading ? (
        <div className='space-y-2'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className='h-28 w-full' />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title='Aún no tienes movimientos recurrentes'
          description='Crea uno para que tu nómina, arriendo o suscripciones se registren automáticamente cada periodo.'
          actions={
            <Button
              variant='soft-sky'
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              + Nueva recurrencia
            </Button>
          }
        />
      ) : (
        <>
          {active.length > 0 && (
            <section className='space-y-2'>
              <h2 className='text-sm font-medium text-muted-foreground'>
                Activas ({active.length})
              </h2>
              {active.map((r) => (
                <Row key={r.id} r={r} />
              ))}
            </section>
          )}

          {paused.length > 0 && (
            <section className='space-y-2'>
              <h2 className='text-sm font-medium text-muted-foreground'>
                Pausadas ({paused.length})
              </h2>
              {paused.map((r) => (
                <Row key={r.id} r={r} />
              ))}
            </section>
          )}
        </>
      )}

      <RecurringTransactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        onSaved={refresh}
      />
    </div>
  );
}
