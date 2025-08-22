// components/forms/RegisterForm.tsx
'use client';

import { useState } from 'react';
import api from '@/lib/api';
import axios from 'axios';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';

type Props = {
  /** Si prefieres volver a la pestaña de login en vez de autologin, úsalo */
  onRegisteredSwitchToLogin?: () => void;
};

export default function RegisterForm({ onRegisteredSwitchToLogin }: Props) {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const { setToken } = useAuthStore();
  const router = useRouter();

  const valid = email && pwd.length >= 8 && pwd === pwd2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      toast.error(
        'Verifica los campos. La contraseña debe tener al menos 8 caracteres y coincidir.',
      );
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', { email, password: pwd });
      toast.success(
        'Cuenta creada. Para ingresar, necesitas una suscripción activa. Por favor contacta al administrador.',
      );
      // volvemos al tab de login si nos pasaron el callback
      onRegisteredSwitchToLogin?.();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const detail = (error.response?.data as { detail?: string })?.detail;
        toast.error(detail || 'No se pudo registrar el usuario.');
      } else {
        toast.error('Error inesperado al registrar.');
      }
      // Si prefieres enviar al login en error específico:
      // onRegisteredSwitchToLogin?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className='space-y-4 w-full max-w-sm mx-auto' onSubmit={handleSubmit}>
      <div className='relative'>
        <Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60' />
        <Input
          type='email'
          placeholder='Correo electrónico'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete='email'
          required
          disabled={loading}
          className='pl-9'
        />
      </div>

      <div className='relative'>
        <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60' />
        <Input
          type={showPwd ? 'text' : 'password'}
          placeholder='Contraseña (mínimo 8 caracteres)'
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          autoComplete='new-password'
          required
          disabled={loading}
          className='pl-9 pr-10'
        />
        <button
          type='button'
          className='absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted'
          onClick={() => setShowPwd((v) => !v)}
          aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {showPwd ? (
            <EyeOff className='h-4 w-4' />
          ) : (
            <Eye className='h-4 w-4' />
          )}
        </button>
      </div>

      <div className='relative'>
        <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60' />
        <Input
          type={showPwd2 ? 'text' : 'password'}
          placeholder='Confirmar contraseña'
          value={pwd2}
          onChange={(e) => setPwd2(e.target.value)}
          autoComplete='new-password'
          required
          disabled={loading}
          className='pl-9 pr-10'
        />
        <button
          type='button'
          className='absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted'
          onClick={() => setShowPwd2((v) => !v)}
          aria-label={showPwd2 ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {showPwd2 ? (
            <EyeOff className='h-4 w-4' />
          ) : (
            <Eye className='h-4 w-4' />
          )}
        </button>
      </div>

      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <Check className='h-3.5 w-3.5' />
        Usa al menos 8 caracteres.
      </div>

      <Button
        type='submit'
        className='w-full'
        variant='soft-emerald'
        disabled={loading || !valid}
      >
        {loading ? 'Creando cuenta…' : 'Crear cuenta'}
      </Button>
    </form>
  );
}
