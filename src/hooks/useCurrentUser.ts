'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { CurrentUser } from '@/types';

/**
 * Usuario autenticado actual (GET /auth/me). Se usa sobre todo para saber si
 * mostrar la sección de administración -- el gating real vive en el backend,
 * esto solo evita enseñar un enlace que daría 403.
 */
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (!cancelled) setUser(data);
      } catch {
        // Sin sesión válida: el middleware ya se encarga de redirigir.
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading, isAdmin: user?.role === 'admin' };
}
