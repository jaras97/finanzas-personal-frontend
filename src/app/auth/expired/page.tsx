'use client';

import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function SubscriptionExpiredPage() {
  const router = useRouter();
  const { clearToken } = useAuthStore();

  return (
    <div className='flex flex-col items-center justify-center min-h-screen px-4 text-center bg-background'>
      <div className='max-w-md p-6 border rounded-lg shadow-sm bg-card'>
        <h1 className='text-2xl font-semibold mb-4 text-destructive'>
          Tu suscripción ha expirado
        </h1>
        <p className='text-muted-foreground mb-4'>
          Para continuar usando{' '}
          <span className='font-semibold'>Finanzas Personales</span>, debes
          renovar tu suscripción.
        </p>
        <p className='text-muted-foreground mb-4'>
          Por favor, contacta al administrador para gestionar la renovación de
          tu cuenta.
        </p>
        <p className='text-sm mb-4'>
          📞 WhatsApp:{' '}
          <a
            href='https://wa.me/573001234567'
            target='_blank'
            className='underline'
          >
            +57 300 123 4567
          </a>
          <br />
          ✉️ Email:{' '}
          <a href='mailto:soporte@tucorreo.com' className='underline'>
            soporte@tucorreo.com
          </a>
        </p>

        <Button
          onClick={() => {
            clearToken();
            Cookies.remove('access_token');
            router.push('/auth/login');
          }}
        >
          Volver al inicio de sesión
        </Button>
      </div>
    </div>
  );
}
