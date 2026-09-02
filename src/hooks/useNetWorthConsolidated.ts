'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import axios from 'axios';
import type { NetWorthConsolidated } from '@/types';
import { useDataVersion } from '@/lib/dataRefresh';

export function useNetWorthConsolidated() {
  const [data, setData] = useState<NetWorthConsolidated | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Al crear una transacción desde el botón flotante, esto hace que
  // la pantalla activa vuelva a pedir sus datos sin recargar la página.
  const dataVersion = useDataVersion();

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
  }, [dataVersion]);

  return { data, loading, error };
}
