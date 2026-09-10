'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { useDataVersion } from '@/lib/dataRefresh';

/**
 * Cuántos movimientos esperan categoría, en TODO el historial.
 *
 * Sin rango de fechas a propósito: si el aviso dependiera del filtro activo,
 * un pendiente de marzo sería invisible para quien está mirando septiembre, y
 * un aviso que solo aparece si acertaste el filtro no avisa de nada.
 *
 * Silencioso ante errores: es información secundaria y un toast rojo por no
 * poder pintar un aviso sería peor que no pintarlo.
 */
export function useUncategorizedCount() {
  const [count, setCount] = useState<number | null>(null);
  const dataVersion = useDataVersion();

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/transactions/uncategorized/count');
      setCount(typeof data?.count === 'number' ? data.count : 0);
    } catch {
      setCount(null);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, dataVersion]);

  return { count, refresh };
}
