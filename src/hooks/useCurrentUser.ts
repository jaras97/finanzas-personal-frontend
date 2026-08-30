'use client';

import { useCallback, useEffect, useState } from 'react';
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

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      // Sin sesión válida: el middleware ya se encarga de redirigir.
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, loading, isAdmin: user?.role === 'admin', refresh: fetchUser };
}
