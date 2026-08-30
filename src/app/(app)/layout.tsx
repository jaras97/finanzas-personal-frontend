// app/(dashboard)/layout.tsx
'use client';

import Sidebar from '@/components/layout/Sidebar';
import { toast } from 'sonner';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useSidebarStore } from '@/lib/store/sidebarStore';
import { cn } from '@/lib/utils';
import Footer from '@/components/layout/Footer';
import QuickAddFab from '@/components/forms/QuickAddFab';
import api from '@/lib/api';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // 1) Hooks SIEMPRE arriba, sin condicionales
  const { status, initialized, isNone, isExpired, isInactive } =
    useSubscriptionStatus();
  // Los administradores no son clientes: gestionan las suscripciones de los
  // demás y no tienen por qué tener una propia. Sin esta excepción, un admin
  // sin suscripción quedaría bloqueado fuera de su propio panel (el backend
  // ya los deja pasar: get_current_admin_user no valida suscripción).
  const { isAdmin, loading: userLoading } = useCurrentUser();
  const router = useRouter();
  const { toggle } = useSidebarStore();
  const didToast = useRef(false);

  const gateReady = initialized && !userLoading;
  const blocked = !isAdmin && (isNone || isExpired || isInactive);

  // 2) Efecto incondicional: decide navegación cuando haya veredicto
  useEffect(() => {
    if (!gateReady || isAdmin) return;

    // Detectar si vienes del login SOLO dentro del efecto (lado cliente)
    const fromLogin =
      typeof window !== 'undefined' &&
      window.sessionStorage.getItem('fromLogin') === '1';

    if (fromLogin) {
      window.sessionStorage.removeItem('fromLogin');

      // Redirecciones silenciosas (sin toasts)
      if (isNone) {
        router.replace('/auth/no-subscription');
      } else if (isExpired) {
        router.replace('/auth/expired');
      } else if (isInactive) {
        router.replace('/auth/inactive');
      }
      return;
    }

    // Caso “deep link” o cambios dentro de la app (con toasts)
    if (didToast.current) return;

    if (isNone) {
      toast.error(
        'Tu cuenta aún no tiene una suscripción activa. Contacta al administrador.',
      );
      didToast.current = true;
      router.replace('/auth/no-subscription');
    } else if (isExpired) {
      toast.error('Tu suscripción ha expirado. Por favor renuévala.');
      didToast.current = true;
      router.replace('/auth/expired');
    } else if (isInactive) {
      toast.error('Tu suscripción está inactiva. Contacta al administrador.');
      didToast.current = true;
      router.replace('/auth/inactive');
    }
  }, [gateReady, isAdmin, isNone, isExpired, isInactive, router]);

  // Materializa los movimientos recurrentes vencidos una vez por sesión, para
  // que el usuario no tenga que acordarse de entrar a la sección. Silencioso
  // cuando no hay nada que hacer; solo avisa si generó algo o si algo quedó
  // pendiente (típicamente saldo insuficiente, que sí requiere su atención).
  useEffect(() => {
    if (!gateReady || blocked) return;
    if (sessionStorage.getItem('recurringRun') === '1') return;
    sessionStorage.setItem('recurringRun', '1');

    (async () => {
      try {
        const { data } = await api.post('/recurring-transactions/run');
        if (data.total_created > 0) {
          toast.success(
            `Se registraron ${data.total_created} ${
              data.total_created === 1 ? 'movimiento recurrente' : 'movimientos recurrentes'
            }.`,
          );
        }
        data.skipped?.forEach((s: { description: string; reason: string }) =>
          toast.warning(`${s.description}: ${s.reason}`, { duration: 8000 }),
        );
      } catch {
        // Silencioso a propósito: es una tarea de fondo, no una acción que el
        // usuario pidió. Si falla, la sección Recurrentes tiene un botón para
        // reintentar manualmente.
      }
    })();
  }, [gateReady, blocked]);

  // 3) Renders (estos returns pueden ir DESPUÉS de los hooks sin romper el orden)
  if (!gateReady) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <p className='text-muted-foreground text-lg'>
          Verificando suscripción...
        </p>
      </div>
    );
  }

  if (blocked) return null;

  return (
    <div className='min-h-screen'>
      <Sidebar />

      {/* FAB para abrir sidebar en mobile */}
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

      <QuickAddFab />

      <main className='md:pl-64'>
        {/* pb-20 en mobile: espacio de seguridad para que el FAB de registro
            rápido (fixed bottom-right) no tape el final del contenido justo
            antes del footer. */}
        <div className='px-4 pt-4 pb-20 md:px-6 md:py-6'>{children}</div>
        <Footer />
      </main>
    </div>
  );
}
