'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import axios from 'axios';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setToken } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token } = response.data as { access_token: string };

      // Persistencia de token
      setToken(access_token);
      api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
      Cookies.set('access_token', access_token, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
      });
      localStorage.setItem('access_token', access_token);

      // Marca que vienes del login (el layout hará redirecciones silenciosas)
      sessionStorage.setItem('fromLogin', '1');

      toast.success('Inicio de sesión exitoso.');
      router.push('/summary');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const detail = (error.response?.data as any)?.detail;

        if (status === 401) {
          toast.error(detail || 'Correo o contraseña incorrectos.');
        } else if (status === 422) {
          toast.error('Datos inválidos. Verifica tu correo y contraseña.');
        } else {
          toast.error(detail || 'Error al iniciar sesión. Intenta de nuevo.');
        }
      } else {
        toast.error('Error inesperado al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='space-y-4 w-full max-w-sm mx-auto bg-card p-6 rounded-lg shadow-sm'
    >
      <Input
        type='email'
        placeholder='Correo electrónico'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={loading}
      />
      <Input
        type='password'
        placeholder='Contraseña'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={loading}
      />
      <Button type='submit' className='w-full' disabled={loading}>
        {loading ? 'Iniciando…' : 'Iniciar Sesión'}
      </Button>
    </form>
  );
}
