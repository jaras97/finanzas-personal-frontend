'use client';

import { useState } from 'react';
import { FormModal } from '@/components/ui/form-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { formatDateInUserTimeZone } from '@/lib/formatDate';
import { useAdminUserDetail } from '@/hooks/useAdminUserDetail';
import type { AdminUserDetail, AdminUser, UserTag } from '@/types';
import { History, Receipt, StickyNote, Activity } from 'lucide-react';

const PESTANAS = [
  { id: 'resumen', label: 'Resumen', icon: Activity },
  { id: 'historial', label: 'Historial', icon: History },
  { id: 'pagos', label: 'Pagos', icon: Receipt },
  { id: 'ficha', label: 'Ficha', icon: StickyNote },
] as const;

type Pestana = (typeof PESTANAS)[number]['id'];

const ACCION_TEXTO: Record<string, string> = {
  activate: 'Activó / reactivó',
  renew: 'Renovó',
  delete: 'Eliminó la suscripción',
  payment: 'Pago',
};

// `backfill` se muestra distinto a propósito: es un período RECONSTRUIDO al
// activar el historial, no algo que se haya registrado cuando ocurrió. Darlo
// por bueno sería presentar una deducción como un hecho.
const ORIGEN_TEXTO: Record<string, string> = {
  activate: ' · activación',
  renew: ' · renovación',
  backfill: ' · reconstruido',
};

const METODO_TEXTO: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  other: 'Otro',
};

function dinero(monto: number, moneda: string) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(monto);
}

export default function UserRecordModal({
  open,
  onOpenChange,
  user,
  tags,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user: AdminUser;
  tags: UserTag[];
  onChanged: () => void;
}) {
  const { detail, setDetail, loading } = useAdminUserDetail(open ? user.id : null);
  const [pestana, setPestana] = useState<Pestana>('resumen');

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Ficha de ${user.email}`}
      size='xl'
      className='w-[min(100vw-1rem,720px)]'
    >
      <div className='space-y-4'>
        {/* Franja de pestañas. Scroll horizontal en móvil en vez de apretujarlas. */}
        <div className='flex gap-1 overflow-x-auto border-b border-slate-200 -mx-1 px-1'>
          {PESTANAS.map(({ id, label, icon: Icono }) => (
            <button
              key={id}
              type='button'
              onClick={() => setPestana(id)}
              className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap px-3 h-10 text-sm rounded-t-md border-b-2 -mb-px',
                pestana === id
                  ? 'border-sky-600 text-sky-700 font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
              aria-current={pestana === id ? 'page' : undefined}
            >
              <Icono className='h-4 w-4' />
              {label}
            </button>
          ))}
        </div>

        {loading && !detail ? (
          <div className='space-y-2'>
            <Skeleton className='h-20 w-full' />
            <Skeleton className='h-20 w-full' />
          </div>
        ) : !detail ? (
          <EmptyState title='No se pudo cargar la ficha' description='Intenta cerrar y abrir de nuevo.' />
        ) : (
          <>
            {pestana === 'resumen' && <Resumen detail={detail} />}
            {pestana === 'historial' && <Historial detail={detail} />}
            {pestana === 'pagos' && (
              <Pagos detail={detail} setDetail={setDetail} onChanged={onChanged} />
            )}
            {pestana === 'ficha' && (
              <Ficha detail={detail} setDetail={setDetail} tags={tags} />
            )}
          </>
        )}
      </div>
    </FormModal>
  );
}

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='rounded-lg bg-white p-3'>
      <p className='text-xs text-muted-foreground'>{label}</p>
      <p className='font-medium mt-0.5'>{children}</p>
    </div>
  );
}

function Resumen({ detail }: { detail: AdminUserDetail }) {
  const m = detail.metrics;
  return (
    <div className='space-y-3'>
      <div className='grid grid-cols-2 gap-2'>
        <Dato label='Cliente desde'>
          {detail.first_subscribed_at
            ? formatDateInUserTimeZone(detail.first_subscribed_at)
            : '—'}
        </Dato>
        <Dato label='Total pagado'>
          {detail.payments.length > 0
            ? dinero(detail.total_paid, detail.payments[0].currency)
            : '—'}
        </Dato>
        <Dato label='Último acceso'>
          {/* Distinguir "nunca entró" de "entró hace mucho" es justamente el
              punto de esta métrica, así que no se colapsan en un guion. */}
          {!m.has_ever_logged_in ? (
            <span className='text-rose-600'>Nunca ha entrado</span>
          ) : m.days_since_last_login === 0 ? (
            'Hoy'
          ) : (
            `Hace ${m.days_since_last_login} ${m.days_since_last_login === 1 ? 'día' : 'días'}`
          )}
        </Dato>
        <Dato label='Registrado'>{formatDateInUserTimeZone(detail.created_at)}</Dato>
      </div>

      <div className='rounded-lg bg-white p-3'>
        <p className='text-xs text-muted-foreground mb-2'>Actividad en la app</p>
        <div className='flex gap-4 text-sm'>
          <span><b>{m.transactions}</b> transacciones</span>
          <span><b>{m.accounts}</b> cuentas</span>
          <span><b>{m.debts}</b> deudas</span>
        </div>
      </div>

      {detail.tags.length > 0 && (
        <div className='flex gap-1.5 flex-wrap'>
          {detail.tags.map((t) => (
            <Badge key={t.id} variant='outline'>{t.name}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function Historial({ detail }: { detail: AdminUserDetail }) {
  if (detail.periods.length === 0 && detail.events.length === 0) {
    return (
      <EmptyState
        icon={History}
        title='Sin historial todavía'
        description='El historial empieza a registrarse desde la próxima activación o renovación. Lo anterior a esta versión no quedó guardado.'
      />
    );
  }

  const hayReconstruidos = detail.periods.some((p) => p.origin === 'backfill');

  return (
    <div className='space-y-4'>
      {hayReconstruidos && (
        <p className='text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2'>
          Los períodos marcados como «reconstruido» se dedujeron de la suscripción
          vigente al activar el historial. Lo anterior a eso no quedó registrado.
        </p>
      )}
      <section>
        <h3 className='text-sm font-medium mb-2'>Períodos cubiertos</h3>
        <div className='space-y-1.5'>
          {detail.periods.map((p) => (
            <div key={p.id} className='rounded-lg bg-white p-3 text-sm'>
              <div className='flex justify-between gap-2 flex-wrap'>
                <span className='font-medium'>
                  {formatDateInUserTimeZone(p.start_date)} → {formatDateInUserTimeZone(p.end_date)}
                </span>
                {p.price > 0 && <span>{dinero(p.price, p.currency)}</span>}
              </div>
              <p className='text-xs text-muted-foreground mt-0.5'>
                {p.plan_name ? `Plan ${p.plan_name}` : 'Sin plan'}
                {ORIGEN_TEXTO[p.origin] ?? ' · activación'}
                {p.created_by_email ? ` · por ${p.created_by_email}` : ''}
              </p>
              {p.note && <p className='text-xs mt-1 italic'>{p.note}</p>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className='text-sm font-medium mb-2'>Bitácora</h3>
        <div className='space-y-1'>
          {detail.events.map((e) => (
            <div key={e.id} className='text-sm flex gap-2 items-start'>
              <span className='text-xs text-muted-foreground shrink-0 w-24 pt-0.5'>
                {formatDateInUserTimeZone(e.created_at)}
              </span>
              <span>
                <b>{ACCION_TEXTO[e.action] ?? e.action}</b>
                {e.months ? ` · ${e.months} ${e.months === 1 ? 'mes' : 'meses'}` : ''}
                {e.performed_by_email ? ` · ${e.performed_by_email}` : ''}
                {e.detail && <span className='block text-xs text-muted-foreground'>{e.detail}</span>}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Pagos({
  detail,
  setDetail,
  onChanged,
}: {
  detail: AdminUserDetail;
  setDetail: (d: AdminUserDetail) => void;
  onChanged: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('transfer');
  const [reference, setReference] = useState('');
  const [busy, setBusy] = useState(false);

  const monto = parseFloat(amount);
  const valido = Number.isFinite(monto) && monto > 0;

  const registrar = async () => {
    if (!valido || busy) return;
    setBusy(true);
    try {
      const { data } = await api.post<AdminUserDetail>(
        `/admin/users/${detail.id}/payments`,
        { amount: monto, method, reference: reference || null },
      );
      setDetail(data);
      setAmount('');
      setReference('');
      toast.success('Pago registrado');
      onChanged();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error?.response?.data?.detail || 'No se pudo registrar el pago.'
          : 'No se pudo registrar el pago.',
      );
    } finally {
      setBusy(false);
    }
  };

  const borrar = async (id: number) => {
    if (!window.confirm('¿Eliminar este pago? Queda constancia en la bitácora.')) return;
    setBusy(true);
    try {
      await api.delete(`/admin/users/${detail.id}/payments/${id}`);
      const { data } = await api.get<AdminUserDetail>(`/admin/users/${detail.id}/detail`);
      setDetail(data);
      toast.success('Pago eliminado');
    } catch {
      toast.error('No se pudo eliminar el pago.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='space-y-3'>
      <div className='rounded-lg bg-white p-3 space-y-2'>
        <p className='text-sm font-medium'>Registrar un pago</p>
        <div className='flex gap-2 flex-wrap'>
          <Input
            type='number'
            min={1}
            placeholder='Monto'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={busy}
            className='w-32'
            aria-label='Monto del pago'
          />
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            disabled={busy}
            aria-label='Método de pago'
            className='h-9 rounded-md border border-slate-200 px-2 text-sm bg-white'
          >
            {Object.entries(METODO_TEXTO).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <Input
            placeholder='Referencia (opcional)'
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            disabled={busy}
            className='flex-1 min-w-[140px]'
            aria-label='Referencia del pago'
          />
          <Button variant='soft-emerald' disabled={!valido || busy} onClick={registrar}>
            Registrar
          </Button>
        </div>
      </div>

      {detail.payments.length === 0 ? (
        <EmptyState icon={Receipt} title='Sin pagos registrados' description='Los pagos que registres quedan acá y en la bitácora.' />
      ) : (
        <div className='space-y-1.5'>
          {detail.payments.map((p) => (
            <div key={p.id} className='rounded-lg bg-white p-3 text-sm flex justify-between gap-2 items-start'>
              <div className='min-w-0'>
                <p className='font-medium'>{dinero(p.amount, p.currency)}</p>
                <p className='text-xs text-muted-foreground'>
                  {formatDateInUserTimeZone(p.paid_at)} · {METODO_TEXTO[p.method] ?? p.method}
                  {p.reference ? ` · ${p.reference}` : ''}
                  {p.created_by_email ? ` · por ${p.created_by_email}` : ''}
                </p>
              </div>
              <Button
                size='sm'
                variant='soft-rose'
                disabled={busy}
                onClick={() => borrar(p.id)}
              >
                Eliminar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Ficha({
  detail,
  setDetail,
  tags,
}: {
  detail: AdminUserDetail;
  setDetail: (d: AdminUserDetail) => void;
  tags: UserTag[];
}) {
  const [fullName, setFullName] = useState(detail.full_name ?? '');
  const [phone, setPhone] = useState(detail.phone ?? '');
  const [notes, setNotes] = useState(detail.notes ?? '');
  const [busy, setBusy] = useState(false);

  const seleccionadas = new Set(detail.tags.map((t) => t.id));

  const guardar = async () => {
    setBusy(true);
    try {
      const { data } = await api.put<AdminUserDetail>(`/admin/users/${detail.id}/profile`, {
        full_name: fullName || null,
        phone: phone || null,
        notes: notes || null,
      });
      setDetail(data);
      toast.success('Ficha guardada');
    } catch {
      toast.error('No se pudo guardar la ficha.');
    } finally {
      setBusy(false);
    }
  };

  const alternarEtiqueta = async (tagId: number) => {
    const nuevas = new Set(seleccionadas);
    if (nuevas.has(tagId)) nuevas.delete(tagId);
    else nuevas.add(tagId);
    setBusy(true);
    try {
      const { data } = await api.put<AdminUserDetail>(`/admin/users/${detail.id}/tags`, {
        tag_ids: [...nuevas],
      });
      setDetail(data);
    } catch {
      toast.error('No se pudieron actualizar las etiquetas.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='space-y-3'>
      <div className='rounded-lg bg-white p-3 space-y-3'>
        <div className='grid gap-3 sm:grid-cols-2'>
          <div className='space-y-1'>
            <label htmlFor='ficha-nombre' className='text-sm font-medium'>Nombre</label>
            <Input id='ficha-nombre' value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={busy} />
          </div>
          <div className='space-y-1'>
            <label htmlFor='ficha-tel' className='text-sm font-medium'>Teléfono</label>
            <Input id='ficha-tel' value={phone} onChange={(e) => setPhone(e.target.value)} disabled={busy} />
          </div>
        </div>
        <div className='space-y-1'>
          <label htmlFor='ficha-notas' className='text-sm font-medium'>Notas</label>
          <Textarea
            id='ficha-notas'
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={busy}
            placeholder='Solo tú ves esto. La persona no puede leerlo.'
          />
        </div>
        <Button variant='soft-emerald' onClick={guardar} disabled={busy}>
          Guardar ficha
        </Button>
      </div>

      <div className='rounded-lg bg-white p-3'>
        <p className='text-sm font-medium mb-2'>Etiquetas</p>
        {tags.length === 0 ? (
          <p className='text-xs text-muted-foreground'>
            Todavía no has creado etiquetas. Puedes crearlas en Paramétricas.
          </p>
        ) : (
          <div className='flex gap-1.5 flex-wrap'>
            {tags.map((t) => {
              const activa = seleccionadas.has(t.id);
              return (
                <button
                  key={t.id}
                  type='button'
                  disabled={busy}
                  onClick={() => alternarEtiqueta(t.id)}
                  aria-pressed={activa}
                  className={cn(
                    'px-3 h-8 rounded-full text-xs border transition-colors',
                    activa
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
                  )}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
