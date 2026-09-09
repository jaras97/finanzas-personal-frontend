'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';
import type { Budget, BudgetGroup, BudgetsResponse } from '@/types';
import { useDataVersion } from '@/lib/dataRefresh';

export function useBudgets() {
  const [items, setItems] = useState<Budget[]>([]);
  // Totales derivados por grupo; los consume el desglose de Presupuestos.
  const [groups, setGroups] = useState<BudgetGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Al crear una transacción desde el botón flotante, esto hace que
  // la pantalla activa vuelva a pedir sus datos sin recargar la página.
  const dataVersion = useDataVersion();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      // Desde el modelo grupo/hoja la respuesta trae dos listas: `items` son
      // los presupuestos reales (siempre en hojas) y `groups` sus totales
      // derivados. `?? data` mantiene esto vivo si el backend aún no desplegó.
      const { data } = await api.get<BudgetsResponse>('/budgets');
      setItems(data?.items ?? (Array.isArray(data) ? data : []));
      setGroups(data?.groups ?? []);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error?.response?.data?.detail || 'Error al cargar presupuestos');
      }
    } finally {
      setLoading(false);
    }
  }, [dataVersion]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, groups, loading, refresh: fetchItems };
}
