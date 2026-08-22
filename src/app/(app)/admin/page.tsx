'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { formatDateInUserTimeZone } from '@/lib/formatDate';
import ManageSubscriptionModal from '@/components/forms/ManageSubscriptionModal';
import type { AdminSubscriptionStatus, AdminUser } from '@/types';
import { Search, ShieldCheck, ShieldOff } from 'lucide-react';
import api from '@/lib/api';
import axios from 'axios';

const statusTone: Record<AdminSubscriptionStatus, string> = {
  active:
    'border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-200 dark:bg-emerald-950/30',
  expired:
    'border-rose-300 text-rose-700 bg-rose-50 dark:border-rose-800 dark:text-rose-200 dark:bg-rose-950/30',
  inactive:
    'border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-800 dark:text-amber-200 dark:bg-amber-950/30',
  none: 'border-slate-300 text-slate-600 bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:bg-slate-900/30',
};

const statusLabel: Record<AdminSubscriptionStatus, string> = {
  active: 'Activa',
  expired: 'Vencida',
  inactive: 'Inactiva',
  none: 'Sin suscripción',
};

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: userLoading, isAdmin } = useCurrentUser();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [managing, setManaging] = useState<AdminUser | null>(null);
  const [roleBusyId, setRoleBusyId] = useState<string | null>(null);

  const { data, loading, refresh } = useAdminUsers(search, page);

  // Debounce del buscador para no disparar una request por tecla
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // El backend ya rechaza a los no-admin con 403; esto solo evita dejar la
  // pantalla en blanco a quien llegue por URL directa.
  useEffect(() => {
    if (!userLoading && user && !isAdmin) {
      toast.error('Esta sección es solo para administradores.');
      router.replace('/summary');
    }
  }, [userLoading, user, isAdmin, router]);

  const handleToggleRole = async (target: AdminUser) => {
    const nextRole = target.role === 'admin' ? 'user' : 'admin';
    const verb = nextRole === 'admin' ? 'dar acceso de administrador a' : 'quitar el acceso de administrador a';
    if (!window.confirm(`¿Seguro que quieres ${verb} ${target.email}?`)) return;

    setRoleBusyId(target.id);
    try {
      await api.patch(`/admin/users/${target.id}/role`, { role: nextRole });
      toast.success(
        nextRole === 'admin'
          ? `${target.email} ahora es administrador.`
          : `${target.email} ya no es administrador.`,
      );
      refresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error?.response?.data?.detail || 'No se pudo cambiar el rol.');
      } else {
        toast.error('Error inesperado al cambiar el rol.');
      }
    } finally {
      setRoleBusyId(null);
    }
  };

  if (userLoading || !isAdmin) {
    return (
      <div className='space-y-4'>
        <Skeleton className='h-8 w-56' />
        <Skeleton className='h-10 w-full max-w-sm' />
        <div className='space-y-2'>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className='h-20 w-full' />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between'>
        <div className='min-w-0'>
          <h1 className='text-2xl font-semibold'>Usuarios</h1>
          <p className='text-sm text-muted-foreground'>
            Gestiona el acceso y las suscripciones de las personas que usan la app.
          </p>
        </div>

        <div className='relative w-full md:w-80'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60' />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder='Buscar por correo…'
            className='pl-9'
            aria-label='Buscar usuarios por correo'
          />
        </div>
      </div>

      {data && (
        <p className='text-xs text-muted-foreground'>
          {data.total} {data.total === 1 ? 'usuario' : 'usuarios'}
          {search ? ` que coinciden con “${search}”` : ''}
        </p>
      )}

      {loading ? (
        <div className='space-y-2'>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className='h-20 w-full' />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title='No hay usuarios que mostrar'
          description={
            search
              ? 'Ningún correo coincide con tu búsqueda.'
              : 'Todavía no hay usuarios registrados.'
          }
        />
      ) : (
        <div className='space-y-2'>
          {data.items.map((u) => {
            const isSelf = u.id === user?.user_id;
            return (
              <Card
                key={u.id}
                variant='white'
                className='p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'
              >
                <div className='min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <p className='font-medium truncate'>{u.email}</p>
                    {u.role === 'admin' && (
                      <Badge variant='secondary' className='w-fit'>
                        Administrador
                      </Badge>
                    )}
                    {isSelf && (
                      <Badge variant='outline' className='w-fit'>
                        Tú
                      </Badge>
                    )}
                  </div>

                  <div className='flex items-center gap-2 mt-1 flex-wrap'>
                    <Badge
                      variant='outline'
                      className={cn('w-fit', statusTone[u.subscription_status])}
                    >
                      {statusLabel[u.subscription_status]}
                    </Badge>
                    {u.subscription_end && (
                      <span className='text-xs text-muted-foreground'>
                        {u.subscription_status === 'expired' ? 'Venció' : 'Vence'} el{' '}
                        {formatDateInUserTimeZone(u.subscription_end)}
                      </span>
                    )}
                    <span className='text-xs text-muted-foreground'>
                      · Registrado el {formatDateInUserTimeZone(u.created_at)}
                    </span>
                  </div>
                </div>

                <div className='flex gap-2 flex-wrap shrink-0'>
                  <Button
                    size='sm'
                    variant='soft-sky'
                    onClick={() => setManaging(u)}
                  >
                    Suscripción
                  </Button>
                  <Button
                    size='sm'
                    variant='soft-slate'
                    disabled={roleBusyId === u.id}
                    onClick={() => handleToggleRole(u)}
                    title={
                      u.role === 'admin'
                        ? 'Quitar acceso de administrador'
                        : 'Dar acceso de administrador'
                    }
                  >
                    {u.role === 'admin' ? (
                      <>
                        <ShieldOff className='h-4 w-4 mr-1' />
                        Quitar admin
                      </>
                    ) : (
                      <>
                        <ShieldCheck className='h-4 w-4 mr-1' />
                        Hacer admin
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {data && data.total_pages > 1 && (
        <div className='flex items-center justify-between'>
          <Button
            size='sm'
            variant='soft-slate'
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span className='text-sm text-muted-foreground'>
            Página {data.page} de {data.total_pages}
          </span>
          <Button
            size='sm'
            variant='soft-slate'
            disabled={page >= data.total_pages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}

      {managing && (
        <ManageSubscriptionModal
          open={!!managing}
          onOpenChange={(o) => !o && setManaging(null)}
          user={managing}
          onUpdated={() => {
            setManaging(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
