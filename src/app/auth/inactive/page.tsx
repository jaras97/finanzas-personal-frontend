'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';
import Cookies from 'js-cookie';

export default function InactivePage() {
  const router = useRouter();
  const { clearToken } = useAuthStore();

  const handleBackToLogin = () => {
    clearToken();
    Cookies.remove('access_token');
    router.push('/auth/login');
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-background text-center p-6'>
      <h1 className='text-3xl font-bold mb-4'>Suscripción inactiva</h1>
      <p className='text-gray-600 max-w-md mb-6'>
        Tu suscripción está actualmente inactiva. Para reactivarla, por favor
        contacta al administrador para más información y poder continuar
        utilizando la plataforma.
      </p>
      <Button onClick={handleBackToLogin}>Volver al inicio de sesión</Button>
    </div>
  );
}
