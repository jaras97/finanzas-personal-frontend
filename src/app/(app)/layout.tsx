// app/(dashboard)/layout.tsx o donde tengas AppLayout
'use client';

import Sidebar from '@/components/layout/Sidebar';
import { toast } from 'sonner';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useSidebarStore } from '@/lib/store/sidebarStore';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSubscriptionStatus();
  const router = useRouter();
  const { toggle } = useSidebarStore();

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

  if (isExpired || noSubscription || isInactive) return null;

  return (
    <div className='min-h-screen'>
      {/* Sidebar fijo en desktop + overlay mobile controlado dentro del componente */}
      <Sidebar />

      {/* FAB para abrir sidebar en mobile al no tener Header */}
      <button
        onClick={toggle}
        className={cn(
          'md:hidden fixed left-3 top-3 z-40 inline-flex h-10 w-10 items-center justify-center rounded-full',
          'bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] shadow-lg active:scale-95',
        )}
        aria-label='Abrir menú'
      >
        <Menu className='h-5 w-5' />
      </button>

      {/* Contenido: deja espacio al sidebar en desktop */}
      <main className='md:pl-64'>
        <div className='px-4 py-4 md:px-6 md:py-6'>{children}</div>
      </main>
    </div>
  );
}
