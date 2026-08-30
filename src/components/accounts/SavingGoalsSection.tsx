'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';
import { useSavingGoals } from '@/hooks/useSavingGoals';
import SavingGoalModal from '@/components/forms/SavingGoalModal';
import type { SavingGoal } from '@/types';
import { Target, Pencil, Pause, PartyPopper } from 'lucide-react';

export default function SavingGoalsSection() {
  const { goals, loading, refresh } = useSavingGoals();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SavingGoal | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const handlePause = async (goal: SavingGoal) => {
    setBusyId(goal.id);
    try {
      await api.put(`/saving-goals/${goal.id}`, { is_active: false });
      toast.success('Meta pausada');
      await refresh();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error) ? error?.response?.data?.detail || 'No se pudo pausar' : 'Error inesperado',
      );
    } finally {
      setBusyId(null);
    }
  };

  if (!loading && goals.length === 0) {
    return (
      <section className='space-y-3'>
        <header>
          <h2 className='text-sm font-medium text-muted-foreground'>Metas de ahorro</h2>
          <p className='text-xs text-muted-foreground/80'>
            Ata una meta a una cuenta completa: "esta cuenta ES mi fondo para X".
          </p>
        </header>
        <EmptyState
          icon={Target}
          title='Aún no tienes metas de ahorro'
          description='Crea una para llevar el progreso de esa cuenta hacia un objetivo.'
          actions={
            <Button variant='soft-sky' size='sm' onClick={() => setModalOpen(true)}>
              + Nueva meta
            </Button>
          }
        />
        <SavingGoalModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          accountIdsWithGoal={[]}
          onSaved={refresh}
        />
      </section>
    );
  }

  return (
    <section className='space-y-3'>
      <header className='flex items-center justify-between'>
        <div>
          <h2 className='text-sm font-medium text-muted-foreground'>Metas de ahorro</h2>
          <p className='text-xs text-muted-foreground/80'>
            El progreso es el saldo actual de cada cuenta contra su meta.
          </p>
        </div>
        <Button size='sm' variant='soft-sky' onClick={() => setModalOpen(true)}>
          + Nueva meta
        </Button>
      </header>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
        {goals.map((goal) => {
          const achieved = goal.progress_percent >= 100;
          const widthPct = Math.min(goal.progress_percent, 100);
          return (
            <Card key={goal.id} variant='white' className='p-4 space-y-3'>
              <div className='flex items-center justify-between gap-2'>
                <p className='font-medium truncate'>{goal.name}</p>
                {achieved ? (
                  <Badge
                    variant='outline'
                    className='w-fit border-emerald-300 text-emerald-700 bg-emerald-50 gap-1'
                  >
                    <PartyPopper className='h-3 w-3' /> Meta cumplida
                  </Badge>
                ) : (
                  <Badge variant='outline' className='w-fit'>
                    {goal.progress_percent.toFixed(0)}%
                  </Badge>
                )}
              </div>
              <p className='text-xs text-muted-foreground'>{goal.account_name}</p>

              <div className='h-2 w-full rounded-full bg-muted overflow-hidden'>
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    achieved ? 'bg-emerald-500' : 'bg-sky-500',
                  )}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <p className='text-sm tabular-nums'>
                {formatCurrency(goal.current_balance, goal.currency)} de{' '}
                {formatCurrency(goal.target_amount, goal.currency)}
              </p>
              {goal.target_date && goal.monthly_savings_needed !== null && !achieved && (
                <p className='text-xs text-muted-foreground'>
                  Necesitas ahorrar{' '}
                  <span className='font-medium text-foreground'>
                    {formatCurrency(goal.monthly_savings_needed, goal.currency)}/mes
                  </span>{' '}
                  para llegar el {goal.target_date}
                </p>
              )}

              <div className='flex gap-2 flex-wrap pt-1'>
                <Button
                  size='sm'
                  variant='soft-sky'
                  disabled={busyId === goal.id}
                  onClick={() => {
                    setEditing(goal);
                    setModalOpen(true);
                  }}
                >
                  <Pencil className='h-4 w-4 mr-1' /> Editar
                </Button>
                <Button
                  size='sm'
                  variant='soft-slate'
                  disabled={busyId === goal.id}
                  onClick={() => handlePause(goal)}
                >
                  <Pause className='h-4 w-4 mr-1' />
                  {busyId === goal.id ? 'Pausando…' : 'Pausar'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <SavingGoalModal
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
        accountIdsWithGoal={goals.map((g) => g.saving_account_id)}
        onSaved={refresh}
      />
    </section>
  );
}
