'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';
import type { SavingGoal } from '@/types';
import { useDataVersion } from '@/lib/dataRefresh';

export function useSavingGoals() {
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Al crear una transacción desde el botón flotante, esto hace que
  // la pantalla activa vuelva a pedir sus datos sin recargar la página.
  const dataVersion = useDataVersion();

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/saving-goals');
      setGoals(data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error?.response?.data?.detail || 'Error al cargar metas de ahorro');
      }
    } finally {
      setLoading(false);
    }
  }, [dataVersion]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return { goals, loading, refresh: fetchGoals };
}
