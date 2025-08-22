// app/auth/no-subscription/page.tsx
'use client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/lib/store';

export default function NoSubscriptionPage() {
  const router = useRouter();
  const { clearToken } = useAuthStore();
  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-background text-center p-6'>
      <div className='max-w-md p-6 border rounded-lg shadow-sm bg-card'>
        <h1 className='text-2xl font-semibold mb-2'>Suscripción pendiente</h1>
        <p className='text-muted-foreground mb-4'>
          Tu cuenta existe pero aún no tiene una suscripción activa. Por favor,
          contacta al administrador.
        </p>
        <Button
          variant='soft-sky'
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
