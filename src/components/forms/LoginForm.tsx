'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setToken } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token } = response.data;
      setToken(access_token);
      Cookies.set('access_token', access_token, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
      });
      toast.success('Inicio de sesión exitoso.');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Error al iniciar sesión');
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4 w-full max-w-sm mx-auto'>
      <Input
        type='email'
        placeholder='Correo electrónico'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type='password'
        placeholder='Contraseña'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type='submit' className='w-full'>
        Iniciar Sesión
      </Button>
    </form>
  );
}
