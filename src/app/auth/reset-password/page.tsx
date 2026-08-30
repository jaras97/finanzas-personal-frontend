'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';
import { Eye, EyeOff, Lock } from 'lucide-react';

const MIN_PASSWORD_LENGTH = 8;

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit =
    !!token && password.length >= MIN_PASSWORD_LENGTH && password === confirm && !saving;

  // Enlace abierto sin token (o manipulado): no tiene sentido mostrar el
  // formulario, solo llevaría a un 400 tras escribir la contraseña.
  if (!token) {
    return (
      <div className='space-y-4 text-center'>
        <h1 className='text-xl font-semibold'>Enlace inválido</h1>
        <p className='text-sm text-muted-foreground'>
          Este enlace de restablecimiento no es válido. Solicita uno nuevo desde la
          pantalla de inicio de sesión.
        </p>
        <Button asChild variant='soft-sky' className='w-full'>
          <Link href='/auth/login'>Volver a iniciar sesión</Link>
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    try {
      await api.post('/auth/reset-password', { token, new_password: password });
      toast.success('Contraseña actualizada. Inicia sesión con la nueva.');
      router.push('/auth/login');
    } catch (error) {
      const detail = axios.isAxiosError(error)
        ? (error.response?.data as { detail?: string })?.detail
        : undefined;
      toast.error(
        detail ||
          'No se pudo restablecer la contraseña. El enlace pudo vencer; solicita uno nuevo.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='space-y-1 text-center'>
        <h1 className='text-xl font-semibold'>Crea una contraseña nueva</h1>
        <p className='text-sm text-muted-foreground'>
          Debe tener al menos {MIN_PASSWORD_LENGTH} caracteres.
        </p>
      </div>

      <div className='space-y-1'>
        <label htmlFor='new-password' className='text-sm font-medium'>
          Nueva contraseña
        </label>
        <div className='relative'>
          <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60' />
          <Input
            id='new-password'
            type={show ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete='new-password'
            disabled={saving}
            aria-invalid={tooShort}
            className='pl-9 pr-10'
          />
          <button
            type='button'
            onClick={() => setShow((v) => !v)}
            className='absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted'
            aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {show ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
          </button>
        </div>
        {tooShort && (
          <p className='text-xs text-rose-600'>
            Usa al menos {MIN_PASSWORD_LENGTH} caracteres.
          </p>
        )}
      </div>

      <div className='space-y-1'>
        <label htmlFor='confirm-password' className='text-sm font-medium'>
          Confirmar contraseña
        </label>
        <Input
          id='confirm-password'
          type={show ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete='new-password'
          disabled={saving}
          aria-invalid={mismatch}
        />
        {mismatch && <p className='text-xs text-rose-600'>Las contraseñas no coinciden.</p>}
      </div>

      <Button type='submit' variant='soft-emerald' className='w-full' disabled={!canSubmit}>
        {saving ? 'Guardando…' : 'Restablecer contraseña'}
      </Button>

      <p className='text-center'>
        <Link href='/auth/login' className='text-xs text-muted-foreground hover:underline'>
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className='relative min-h-[100dvh] flex items-center justify-center p-4'>
      <div className='app-bg' />
      <Card variant='white' className='w-full max-w-[420px] rounded-2xl'>
        <CardContent className='p-6'>
          {/* useSearchParams exige un límite de Suspense en el App Router. */}
          <Suspense
            fallback={<p className='text-sm text-muted-foreground text-center'>Cargando…</p>}
          >
            <ResetPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
