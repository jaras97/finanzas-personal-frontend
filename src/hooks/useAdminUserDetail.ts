'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import type { AdminUserDetail } from '@/types';

/**
 * Ficha completa de una persona en el panel de admin.
 *
 * `setDetail` se expone a propósito: los endpoints que modifican la ficha
 * (notas, etiquetas, pagos) devuelven la ficha ya actualizada, así que quien
 * llama puede aplicarla sin pedirla otra vez.
 */
export function useAdminUserDetail(userId: string | null) {
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data } = await api.get<AdminUserDetail>(`/admin/users/${userId}/detail`);
      setDetail(data);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setDetail(null);
      return;
    }
    refresh();
  }, [userId, refresh]);

  return { detail, setDetail, loading, refresh };
}
