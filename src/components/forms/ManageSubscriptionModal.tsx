'use client';

import { useState } from 'react';
import { DialogClose } from '@/components/ui/dialog';
import { FormModal } from '@/components/ui/form-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import InfoHint from '@/components/ui/info-hint';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';
import { formatDateInUserTimeZone } from '@/lib/formatDate';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import type { AdminUser } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser;
  onUpdated: () => void;
}

export default function ManageSubscriptionModal({
  open,
  onOpenChange,
  user,
  onUpdated,
}: Props) {
  const [months, setMonths] = useState('1');
  const [planId, setPlanId] = useState<string>('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const { plans } = useSubscriptionPlans();

  // Elegir un plan fija la duración: el backend usa la del plan y descarta
  // `months`, así que dejar el campo editable sugeriría un control que no
  // existe.
  const planElegido = plans.find((p) => String(p.id) === planId);

  const extras = () =>
    `${planId ? `&plan_id=${planId}` : ''}` +
    `${note.trim() ? `&note=${encodeURIComponent(note.trim())}` : ''}`;

  const hasSubscription = user.subscription_status !== 'none';
  const monthsNum = parseInt(months, 10);
  const monthsValid = Number.isFinite(monthsNum) && monthsNum >= 1 && monthsNum <= 60;

  const run = async (
    fn: () => Promise<unknown>,
    successMsg: string,
    fallbackErr: string,
  ) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      toast.success(successMsg);
      onUpdated();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error?.response?.data?.detail || fallbackErr);
      } else {
        toast.error(fallbackErr);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleActivate = () =>
    run(
      () =>
        api.post(
          `/subscriptions/admin/activate?user_id=${user.id}&months=${monthsNum}${extras()}`,
        ),
      `Suscripción activada por ${monthsNum} ${monthsNum === 1 ? 'mes' : 'meses'}.`,
      'No se pudo activar la suscripción.',
    );

  const handleRenew = () =>
    run(
      () =>
        api.post(
          `/subscriptions/admin/renew?user_id=${user.id}&months=${monthsNum}${extras()}`,
        ),
      `Suscripción renovada por ${monthsNum} ${monthsNum === 1 ? 'mes' : 'meses'}.`,
      'No se pudo renovar la suscripción.',
    );

  const handleDelete = () => {
    if (
      !window.confirm(
        `¿Eliminar la suscripción de ${user.email}? Perderá el acceso a la app hasta que le crees una nueva. Sus datos financieros no se borran.`,
      )
    )
      return;
    return run(
      () => api.delete(`/subscriptions/admin/${user.id}`),
      'Suscripción eliminada.',
      'No se pudo eliminar la suscripción.',
    );
  };

  return (
    <FormModal
      open={open}
      onOpenChange={(o) => !busy && onOpenChange(o)}
      className='w-[min(100vw-1rem,520px)]'
      title={`Suscripción de ${user.email}`}
      footer={
        <DialogClose asChild>
          <Button
            className='bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 sm:min-w-[120px]'
            disabled={busy}
          >
            Cerrar
          </Button>
        </DialogClose>
      }
    >
      <div className='space-y-4' aria-busy={busy}>
          <div className='rounded-lg bg-white p-3 space-y-1'>
            <div className='flex items-center gap-2'>
              <span className='text-sm text-muted-foreground'>Estado actual:</span>
              <Badge variant={hasSubscription ? 'default' : 'outline'}>
                {user.subscription_status === 'active'
                  ? 'Activa'
                  : user.subscription_status === 'expired'
                  ? 'Vencida'
                  : user.subscription_status === 'inactive'
                  ? 'Inactiva'
                  : 'Sin suscripción'}
              </Badge>
            </div>
            {user.subscription_end && (
              <p className='text-xs text-muted-foreground'>
                {user.subscription_status === 'expired' ? 'Venció' : 'Vence'} el{' '}
                {formatDateInUserTimeZone(user.subscription_end)}
              </p>
            )}
          </div>

          <div className='space-y-1'>
            <label htmlFor='sub-plan' className='text-sm font-medium'>
              Plan
            </label>
            <select
              id='sub-plan'
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              disabled={busy}
              className='h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm'
            >
              <option value=''>Sin plan (indicar meses a mano)</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.duration_months}{' '}
                  {p.duration_months === 1 ? 'mes' : 'meses'}
                  {p.price > 0 ? ` · ${p.price.toLocaleString('es-CO')} ${p.currency}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <label htmlFor='sub-months' className='text-sm font-medium'>
                Meses
              </label>
              <InfoHint side='top'>
                Cada mes se cuenta como <b>30 días</b>. Al renovar una suscripción
                vigente, el tiempo se <b>suma</b> a la fecha de vencimiento actual.
              </InfoHint>
            </div>
            <Input
              id='sub-months'
              type='number'
              min={1}
              max={60}
              value={planElegido ? String(planElegido.duration_months) : months}
              onChange={(e) => setMonths(e.target.value)}
              disabled={busy || !!planElegido}
              className='bg-white'
            />
            {planElegido ? (
              <p className='text-xs text-muted-foreground'>
                La duración la fija el plan «{planElegido.name}».
              </p>
            ) : (
              !monthsValid &&
              months !== '' && (
                <p className='text-xs text-rose-600'>Ingresa un número entre 1 y 60.</p>
              )
            )}
          </div>

          <div className='space-y-1'>
            <label htmlFor='sub-note' className='text-sm font-medium'>
              Nota (opcional)
            </label>
            <Input
              id='sub-note'
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={busy}
              placeholder='Queda guardada en el historial'
              className='bg-white'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <Button
              variant='soft-emerald'
              disabled={busy || (!planElegido && !monthsValid) || user.subscription_status === 'active'}
              onClick={handleActivate}
              title={
                user.subscription_status === 'active'
                  ? 'Ya tiene una suscripción vigente: usa Renovar'
                  : undefined
              }
            >
              {hasSubscription ? 'Reactivar suscripción' : 'Crear suscripción'}
            </Button>
            <Button
              variant='soft-sky'
              disabled={busy || (!planElegido && !monthsValid) || !hasSubscription}
              onClick={handleRenew}
              title={!hasSubscription ? 'Este usuario aún no tiene suscripción' : undefined}
            >
              Renovar / extender
            </Button>
            <Button
              variant='soft-rose'
              disabled={busy || !hasSubscription}
              onClick={handleDelete}
            >
              Eliminar suscripción
            </Button>
          </div>
      </div>
    </FormModal>
  );
}
