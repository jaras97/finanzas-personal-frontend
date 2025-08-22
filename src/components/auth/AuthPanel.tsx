// components/auth/AuthPanel.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoginForm from '@/components/forms/LoginForm';
import { cn } from '@/lib/utils';
import RegisterForm from '../forms/RegisterForm';
import ForgotPasswordForm from '../forms/ForgotPasswordForm';

type Mode = 'login' | 'register' | 'forgot';

export default function AuthPanel() {
  const [mode, setMode] = useState<Mode>('login');

  const TabButton = ({
    value,
    children,
    className,
  }: {
    value: Mode;
    children: React.ReactNode;
    className?: string;
  }) => {
    const active = mode === value;
    const variants: Record<
      Mode,
      React.ComponentProps<typeof Button>['variant']
    > = {
      login: 'soft-sky',
      register: 'soft-emerald',
      forgot: 'soft-amber',
    };

    return (
      <Button
        type='button'
        role='tab'
        aria-selected={active}
        variant={active ? variants[value] : 'outline'}
        onClick={() => setMode(value)}
        className={cn(
          // permitir 2 líneas, centrado y altura auto
          'w-full rounded-full h-auto min-h-10 px-4 py-2',
          'whitespace-normal break-words text-center leading-tight',
          // suaviza color cuando no está activo
          !active && 'text-slate-700',
          className,
        )}
      >
        {children}
      </Button>
    );
  };

  return (
    <Card
      variant='white'
      className={cn(
        'w-full max-w-[840px] overflow-hidden',
        'grid grid-cols-1 md:grid-cols-2 p-0 rounded-2xl',
      )}
    >
      {/* Lado visual (oculto en mobile) */}
      <div className='hidden md:flex flex-col justify-center p-8 panel-muted'>
        <div>
          <h1 className='text-2xl font-semibold'>Bienvenido 👋</h1>
          <p className='text-sm text-muted-foreground mt-1'>
            Accede para continuar con tu planeación financiera.
          </p>
        </div>

        <ul className='mt-6 text-sm text-slate-700 space-y-2'>
          <li>• Resumen financiero</li>
          <li>• Control de transacciones</li>
          <li>• Todo en un solo lugar</li>
        </ul>
      </div>

      {/* Lado de formularios */}
      <CardContent className='p-6 sm:p-8'>
        {/* Switcher */}
        <div
          role='tablist'
          aria-label='Cambiar modo de autenticación'
          className='grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6'
        >
          <TabButton value='login'>Iniciar sesión</TabButton>
          <TabButton value='register'>Crear cuenta</TabButton>
          {/* ocupa dos columnas en >=sm para evitar apretujes */}
          {/* <TabButton value='forgot' className='sm:col-span-2'>
            ¿Olvidaste contraseña?
          </TabButton> */}
        </div>

        {mode === 'login' && <LoginForm />}
        {mode === 'register' && (
          <RegisterForm onRegisteredSwitchToLogin={() => setMode('login')} />
        )}
        {mode === 'forgot' && <ForgotPasswordForm />}
      </CardContent>
    </Card>
  );
}
