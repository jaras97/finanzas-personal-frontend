'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import InfoHint from '@/components/ui/info-hint';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { useUserTags } from '@/hooks/useUserTags';
import { useCurrencies } from '@/hooks/useCurrencies';
import type { SubscriptionPlan } from '@/types';
import { Package, Tag, ArrowLeft, Trash2 } from 'lucide-react';

export default function ParametricasPage() {
  const { plans, loading, refresh } = useSubscriptionPlans(true);
  const { tags, refresh: refreshTags } = useUserTags();
  const { currencies } = useCurrencies();

  const [nombre, setNombre] = useState('');
  const [meses, setMeses] = useState('1');
  const [precio, setPrecio] = useState('0');
  const [moneda, setMoneda] = useState('COP');
  const [busy, setBusy] = useState(false);

  const [tagNombre, setTagNombre] = useState('');

  const mesesNum = parseInt(meses, 10);
  const precioNum = parseFloat(precio);
  const planValido =
    nombre.trim().length > 0 &&
    Number.isFinite(mesesNum) &&
    mesesNum >= 1 &&
    mesesNum <= 60 &&
    Number.isFinite(precioNum) &&
    precioNum >= 0;

  const error = (e: unknown, fallback: string) =>
    toast.error(
      axios.isAxiosError(e) ? e?.response?.data?.detail || fallback : fallback,
    );

  const crearPlan = async () => {
    if (!planValido || busy) return;
    setBusy(true);
    try {
      await api.post('/admin/subscription-plans', {
        name: nombre.trim(),
        duration_months: mesesNum,
        price: precioNum,
        currency: moneda,
      });
      toast.success('Plan creado');
      setNombre('');
      setMeses('1');
      setPrecio('0');
      await refresh();
    } catch (e) {
      error(e, 'No se pudo crear el plan.');
    } finally {
      setBusy(false);
    }
  };

  const alternarPlan = async (plan: SubscriptionPlan) => {
    setBusy(true);
    try {
      if (plan.is_active) {
        await api.delete(`/admin/subscription-plans/${plan.id}`);
        toast.success('Plan retirado del catálogo');
      } else {
        await api.put(`/admin/subscription-plans/${plan.id}`, { is_active: true });
        toast.success('Plan reactivado');
      }
      await refresh();
    } catch (e) {
      error(e, 'No se pudo actualizar el plan.');
    } finally {
      setBusy(false);
    }
  };

  const crearEtiqueta = async () => {
    if (!tagNombre.trim() || busy) return;
    setBusy(true);
    try {
      await api.post('/admin/tags', { name: tagNombre.trim() });
      setTagNombre('');
      await refreshTags();
    } catch (e) {
      error(e, 'No se pudo crear la etiqueta.');
    } finally {
      setBusy(false);
    }
  };

  const borrarEtiqueta = async (id: number, name: string) => {
    if (!window.confirm(`¿Eliminar la etiqueta "${name}"? Se quitará de todas las personas que la tengan.`))
      return;
    setBusy(true);
    try {
      await api.delete(`/admin/tags/${id}`);
      await refreshTags();
    } catch (e) {
      error(e, 'No se pudo eliminar la etiqueta.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Paramétricas'
        subtitle='Planes y etiquetas que usas para llevar el registro de las personas.'
        actions={
          <Button variant='soft-slate' asChild>
            <Link href='/admin'>
              <ArrowLeft className='h-4 w-4 mr-1' /> Volver a usuarios
            </Link>
          </Button>
        }
      />

      {/* Planes */}
      <Card variant='white' className='p-5 space-y-4'>
        <div className='flex items-center gap-2'>
          <Package className='h-4 w-4' />
          <h2 className='font-medium'>Planes de suscripción</h2>
          <InfoHint side='top'>
            Al activar o renovar puedes elegir un plan en vez de escribir los meses.
            El precio se copia al historial en ese momento, así que cambiarlo después
            no altera lo ya cobrado.
          </InfoHint>
        </div>

        <div className='flex gap-2 flex-wrap items-end'>
          <div className='space-y-1'>
            <label htmlFor='plan-nombre' className='text-xs font-medium'>Nombre</label>
            <Input id='plan-nombre' value={nombre} onChange={(e) => setNombre(e.target.value)}
                   disabled={busy} className='w-40' placeholder='Mensual' />
          </div>
          <div className='space-y-1'>
            <label htmlFor='plan-meses' className='text-xs font-medium'>Meses</label>
            <Input id='plan-meses' type='number' min={1} max={60} value={meses}
                   onChange={(e) => setMeses(e.target.value)} disabled={busy} className='w-24' />
          </div>
          <div className='space-y-1'>
            <label htmlFor='plan-precio' className='text-xs font-medium'>Precio</label>
            <Input id='plan-precio' type='number' min={0} value={precio}
                   onChange={(e) => setPrecio(e.target.value)} disabled={busy} className='w-32' />
          </div>
          <div className='space-y-1'>
            <label htmlFor='plan-moneda' className='text-xs font-medium'>Moneda</label>
            <select id='plan-moneda' value={moneda} onChange={(e) => setMoneda(e.target.value)}
                    disabled={busy}
                    className='h-9 rounded-md border border-slate-200 bg-white px-2 text-sm'>
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>{c.code}</option>
              ))}
            </select>
          </div>
          <Button variant='soft-emerald' onClick={crearPlan} disabled={!planValido || busy}>
            Crear plan
          </Button>
        </div>

        {loading ? (
          <Skeleton className='h-16 w-full' />
        ) : plans.length === 0 ? (
          <EmptyState icon={Package} title='Sin planes' description='Crea el primero arriba.' />
        ) : (
          <div className='space-y-1.5'>
            {plans.map((p) => (
              <div key={p.id}
                   className='rounded-lg border border-slate-100 p-3 flex justify-between gap-2 items-center flex-wrap'>
                <div className='flex items-center gap-2 flex-wrap'>
                  <span className='font-medium'>{p.name}</span>
                  <Badge variant='outline'>
                    {p.duration_months} {p.duration_months === 1 ? 'mes' : 'meses'}
                  </Badge>
                  {p.price > 0 && (
                    <span className='text-sm text-muted-foreground'>
                      {p.price.toLocaleString('es-CO')} {p.currency}
                    </span>
                  )}
                  {!p.is_active && <Badge variant='secondary'>Retirado</Badge>}
                </div>
                <Button size='sm' variant={p.is_active ? 'soft-rose' : 'soft-emerald'}
                        disabled={busy} onClick={() => alternarPlan(p)}>
                  {p.is_active ? 'Retirar' : 'Reactivar'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Etiquetas */}
      <Card variant='white' className='p-5 space-y-4'>
        <div className='flex items-center gap-2'>
          <Tag className='h-4 w-4' />
          <h2 className='font-medium'>Etiquetas</h2>
          <InfoHint side='top'>
            Para clasificar personas: prueba, cortesía, moroso… Se asignan desde la
            ficha de cada usuario.
          </InfoHint>
        </div>

        <div className='flex gap-2 flex-wrap items-end'>
          <div className='space-y-1'>
            <label htmlFor='tag-nombre' className='text-xs font-medium'>Nombre</label>
            <Input id='tag-nombre' value={tagNombre} onChange={(e) => setTagNombre(e.target.value)}
                   disabled={busy} className='w-48' placeholder='Cortesía' />
          </div>
          <Button variant='soft-emerald' onClick={crearEtiqueta}
                  disabled={!tagNombre.trim() || busy}>
            Crear etiqueta
          </Button>
        </div>

        {tags.length === 0 ? (
          <p className='text-sm text-muted-foreground'>Todavía no hay etiquetas.</p>
        ) : (
          <div className='flex gap-1.5 flex-wrap'>
            {tags.map((t) => (
              <span key={t.id}
                    className='inline-flex items-center gap-1 rounded-full border border-slate-200 pl-3 pr-1 h-8 text-xs'>
                {t.name}
                <button type='button' disabled={busy}
                        onClick={() => borrarEtiqueta(t.id, t.name)}
                        aria-label={`Eliminar la etiqueta ${t.name}`}
                        className='inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-rose-50 text-rose-600'>
                  <Trash2 className='h-3 w-3' />
                </button>
              </span>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
