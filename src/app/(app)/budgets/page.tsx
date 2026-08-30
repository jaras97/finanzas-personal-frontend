'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import CategoriesTabs from '@/components/layout/CategoriesTabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import axios from 'axios';
import { formatCurrency } from '@/lib/format';
import { useBudgets } from '@/hooks/useBudgets';
import BudgetModal from '@/components/forms/BudgetModal';
import type { Budget } from '@/types';
import { PiggyBank, Pencil, Pause } from 'lucide-react';

function progressTone(percentage: number) {
  if (percentage >= 100) {
    return {
      bar: 'bg-rose-500',
      badge: 'border-rose-300 text-rose-700 bg-rose-50 dark:border-rose-800 dark:text-rose-200 dark:bg-rose-950/30',
    };
  }
  if (percentage >= 80) {
    return {
      bar: 'bg-amber-500',
      badge: 'border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-800 dark:text-amber-200 dark:bg-amber-950/30',
    };
  }
  return {
    bar: 'bg-emerald-500',
    badge: 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-200 dark:bg-emerald-950/30',
  };
}

export default function BudgetsPage() {
  const { items, loading, refresh } = useBudgets();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const handlePause = async (b: Budget) => {
    setBusyId(b.id);
    try {
      await api.post(`/budgets/${b.id}/pause`);
      toast.success('Presupuesto pausado desde este mes');
      await refresh();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error?.response?.data?.detail || 'No se pudo pausar'
          : 'Error inesperado',
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Presupuestos'
        subtitle='Cuánto planeas gastar este mes por categoría, y cuánto llevas.'
        actions={
          <Button
            variant='soft-sky'
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            + Nuevo presupuesto
          </Button>
        }
      />
      <CategoriesTabs />

      {loading ? (
        <div className='space-y-2'>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className='h-28 w-full' />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title='Aún no tienes presupuestos'
          description='Crea uno para llevar el control de cuánto gastas por categoría cada mes.'
          actions={
            <Button variant='soft-sky' size='sm' onClick={() => setModalOpen(true)}>
              + Nuevo presupuesto
            </Button>
          }
        />
      ) : (
        <div className='space-y-2'>
          {items.map((b) => {
            const tone = progressTone(b.percentage);
            const widthPct = Math.min(b.percentage, 100);
            return (
              <Card key={b.id} variant='white' className='p-4 space-y-3'>
                <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                  <div className='min-w-0'>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <p className='font-medium truncate'>{b.category_name}</p>
                      <Badge variant='outline' className={cn('w-fit', tone.badge)}>
                        {b.percentage.toFixed(0)}%
                      </Badge>
                      {b.percentage >= 100 && (
                        <Badge
                          variant='outline'
                          className='w-fit border-rose-300 text-rose-700 bg-rose-50 dark:border-rose-800 dark:text-rose-200 dark:bg-rose-950/30'
                        >
                          Presupuesto superado
                        </Badge>
                      )}
                    </div>
                    <p className='mt-1 text-sm text-muted-foreground tabular-nums'>
                      {formatCurrency(b.spent, b.currency)} de{' '}
                      {formatCurrency(b.amount, b.currency)}
                    </p>
                  </div>

                  <div className='flex gap-2 flex-wrap shrink-0'>
                    <Button
                      size='sm'
                      variant='soft-sky'
                      disabled={busyId === b.id}
                      onClick={() => {
                        setEditing(b);
                        setModalOpen(true);
                      }}
                    >
                      <Pencil className='h-4 w-4 mr-1' /> Editar
                    </Button>
                    <Button
                      size='sm'
                      variant='soft-slate'
                      disabled={busyId === b.id}
                      onClick={() => handlePause(b)}
                    >
                      <Pause className='h-4 w-4 mr-1' />
                      {busyId === b.id ? 'Pausando…' : 'Pausar'}
                    </Button>
                  </div>
                </div>

                <div className='h-2 w-full rounded-full bg-muted overflow-hidden'>
                  <div
                    className={cn('h-full rounded-full transition-all', tone.bar)}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <BudgetModal
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
        onSaved={refresh}
      />
    </div>
  );
}
