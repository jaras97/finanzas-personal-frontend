'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import axios from 'axios';
import type { NetWorthConsolidated } from '@/types';

export function useNetWorthConsolidated() {
  const [data, setData] = useState<NetWorthConsolidated | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get('/summary-extra/net-worth-consolidated');
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled && axios.isAxiosError(err)) {
          setError(err?.response?.data?.detail || 'Error al cargar el patrimonio consolidado');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
