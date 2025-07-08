'use client';

import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { toast } from 'sonner';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSubscriptionStatus();
  const router = useRouter();

  const loading = status === 'loading';
  const isExpired = status === 'expired';
  const noSubscription = status === 'none';
  const isInactive = status === 'inactive';

  useEffect(() => {
    if (!loading) {
      if (isExpired || noSubscription) {
        toast.error(
          'Tu suscripción ha expirado o no existe. Contacta al administrador para renovarla.',
        );
        router.push('/auth/expired');
      } else if (isInactive) {
        toast.error(
          'Tu suscripción está inactiva. Contacta al administrador para activarla.',
        );
        router.push('/auth/inactive');
      }
    }
  }, [status, loading, isExpired, noSubscription, isInactive, router]);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <p className='text-muted-foreground text-lg'>
          Verificando suscripción...
        </p>
      </div>
    );
  }

  if (isExpired || noSubscription || isInactive) {
    return null; // evita render mientras redirige
  }

  return (
    <div className='flex min-h-screen'>
      <Sidebar />
      <div className='flex flex-col flex-1'>
        <Header />
        <main className='flex-1 p-4 bg-background'>{children}</main>
      </div>
    </div>
  );
}
