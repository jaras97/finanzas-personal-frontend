'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import InfoHint from '@/components/ui/info-hint';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';
import { extractErrorMessage } from '@/lib/extractErrorMessage';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCurrencies } from '@/hooks/useCurrencies';
import { Eye, EyeOff, Lock, Globe } from 'lucide-react';

const MIN_PASSWORD_LENGTH = 8;

export default function AccountPage() {
  const { user, loading, refresh: refreshUser } = useCurrentUser();
  const { currencies } = useCurrencies();

  const [savingCurrency, setSavingCurrency] = useState(false);

  const handleReportCurrencyChange = async (value: string) => {
    setSavingCurrency(true);
    try {
      await api.patch('/account/preferences', { report_currency: value });
      toast.success('Moneda de reporte actualizada');
      await refreshUser();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? extractErrorMessage(error)
          : 'No se pudo actualizar la moneda de reporte.',
      );
    } finally {
      setSavingCurrency(false);
    }
  };

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [saving, setSaving] = useState(false);

  const tooShort = next.length > 0 && next.length < MIN_PASSWORD_LENGTH;
  const mismatch = confirm.length > 0 && next !== confirm;
  const sameAsCurrent = next.length > 0 && next === current;

  const canSubmit =
    !!current &&
    next.length >= MIN_PASSWORD_LENGTH &&
    next === confirm &&
    !sameAsCurrent &&
    !saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        current_password: current,
        new_password: next,
      });
      toast.success('Contraseña actualizada correctamente.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (error) {
      // 400 del backend = contraseña actual incorrecta; el resto se muestra tal cual
      toast.error(
        axios.isAxiosError(error)
          ? extractErrorMessage(error)
          : 'Error inesperado al cambiar la contraseña.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='space-y-6 max-w-2xl'>
      <PageHeader
        title='Mi cuenta'
        subtitle='Datos de tu sesión y seguridad de acceso.'
      />

      {/* Datos de la cuenta */}
      <Card variant='white'>
        <CardContent className='p-5 space-y-2'>
          {loading ? (
            <>
              <Skeleton className='h-5 w-64' />
              <Skeleton className='h-5 w-32' />
            </>
          ) : (
            <>
              <div className='flex items-center gap-2 flex-wrap'>
                <span className='text-sm text-muted-foreground'>Correo:</span>
                <span className='font-medium'>{user?.email}</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='text-sm text-muted-foreground'>Rol:</span>
                <Badge variant={user?.role === 'admin' ? 'secondary' : 'outline'}>
                  {user?.role === 'admin' ? 'Administrador' : 'Usuario'}
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preferencias */}
      <Card variant='white'>
        <CardContent className='p-5'>
          <div className='flex items-center gap-2 mb-4'>
            <Globe className='h-4 w-4' />
            <h2 className='font-medium'>Preferencias</h2>
            <InfoHint side='top'>
              Moneda en la que se muestra tu patrimonio neto consolidado en Resumen,
              convirtiendo el resto de tus monedas con la tasa de cambio de hoy. No hace
              falta que tengas cuentas en esta moneda.
            </InfoHint>
          </div>
          <div className='space-y-1 max-w-xs'>
            <label className='text-sm font-medium'>Moneda de reporte</label>
            {loading ? (
              <Skeleton className='h-9 w-full' />
            ) : (
              <Select
                value={user?.report_currency}
                onValueChange={handleReportCurrencyChange}
                disabled={savingCurrency}
              >
                <SelectTrigger className='bg-white'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='select-solid z-[140]'>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cambiar contraseña */}
      <Card variant='white'>
        <CardContent className='p-5'>
          <div className='flex items-center gap-2 mb-4'>
            <Lock className='h-4 w-4' />
            <h2 className='font-medium'>Cambiar contraseña</h2>
            <InfoHint side='top'>
              Al cambiarla, tu sesión actual sigue activa. Necesitarás la nueva
              contraseña la próxima vez que inicies sesión.
            </InfoHint>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Actual */}
            <div className='space-y-1'>
              <label htmlFor='pwd-current' className='text-sm font-medium'>
                Contraseña actual
              </label>
              <div className='relative'>
                <Input
                  id='pwd-current'
                  type={showCurrent ? 'text' : 'password'}
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  autoComplete='current-password'
                  disabled={saving}
                  className='pr-10'
                />
                <button
                  type='button'
                  onClick={() => setShowCurrent((v) => !v)}
                  className='absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted'
                  aria-label={showCurrent ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showCurrent ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
            </div>

            {/* Nueva */}
            <div className='space-y-1'>
              <label htmlFor='pwd-new' className='text-sm font-medium'>
                Nueva contraseña
              </label>
              <div className='relative'>
                <Input
                  id='pwd-new'
                  type={showNext ? 'text' : 'password'}
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  autoComplete='new-password'
                  disabled={saving}
                  className='pr-10'
                  aria-invalid={tooShort || sameAsCurrent}
                />
                <button
                  type='button'
                  onClick={() => setShowNext((v) => !v)}
                  className='absolute right-1 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted'
                  aria-label={showNext ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showNext ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </button>
              </div>
              {tooShort && (
                <p className='text-xs text-rose-600'>
                  Usa al menos {MIN_PASSWORD_LENGTH} caracteres.
                </p>
              )}
              {sameAsCurrent && (
                <p className='text-xs text-rose-600'>
                  La nueva contraseña debe ser distinta de la actual.
                </p>
              )}
            </div>

            {/* Confirmar */}
            <div className='space-y-1'>
              <label htmlFor='pwd-confirm' className='text-sm font-medium'>
                Confirmar nueva contraseña
              </label>
              <Input
                id='pwd-confirm'
                type={showNext ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete='new-password'
                disabled={saving}
                aria-invalid={mismatch}
              />
              {mismatch && (
                <p className='text-xs text-rose-600'>Las contraseñas no coinciden.</p>
              )}
            </div>

            <Button
              type='submit'
              variant='soft-emerald'
              disabled={!canSubmit}
              className='w-full sm:w-auto sm:min-w-[200px]'
            >
              {saving ? 'Guardando…' : 'Cambiar contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
