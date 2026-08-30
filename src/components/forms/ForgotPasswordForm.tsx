// components/forms/ForgotPasswordForm.tsx
'use client';

import { useState } from 'react';
import api from '@/lib/api';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success(
        'Si el correo existe, te enviamos instrucciones para recuperar tu contraseña.',
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          (error.response?.data as { detail?: string })?.detail ||
            'No se pudo enviar el correo de recuperación.',
        );
      } else {
        toast.error('Error inesperado. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className='space-y-4 w-full max-w-sm mx-auto' onSubmit={onSubmit}>
      <div className='relative'>
        <Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60' />
        <Input
          type='email'
          placeholder='Tu correo registrado'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          autoComplete='email'
          className='pl-9'
        />
      </div>

      <Button
        type='submit'
        className='w-full'
        variant='soft-amber'
        disabled={loading}
      >
        {loading ? 'Enviando…' : 'Enviar instrucciones'}
      </Button>

      <p className='text-xs text-muted-foreground text-center'>
        Te enviaremos un enlace temporal para restablecer tu contraseña.
      </p>
    </form>
  );
}
