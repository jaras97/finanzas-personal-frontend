'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { useDataVersion } from '@/lib/dataRefresh';
import type { Category } from '@/types';

/**
 * Categorías activas del usuario.
 *
 * Existe porque la lista de movimientos necesita el árbol completo para pintar
 * un selector por fila, y hacer un fetch por fila sería una petición por cada
 * movimiento en pantalla. (Los formularios siguen cargándolas por su cuenta:
 * unificarlos es una limpieza aparte, no parte de esta.)
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const dataVersion = useDataVersion();

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, dataVersion]);

  return { categories, loading, refresh };
}
