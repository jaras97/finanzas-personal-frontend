// app/auth/no-subscription/page.tsx
'use client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/api';

export default function NoSubscriptionPage() {
  const router = useRouter();
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
          onClick={async () => {
            await logout();
            router.push('/auth/login');
          }}
        >
          Volver al inicio de sesión
        </Button>
      </div>
    </div>
  );
}
