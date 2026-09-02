'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { DebtStatement } from '@/types';
import { useDataVersion } from '@/lib/dataRefresh';

/**
 * Ciclo de facturación de una tarjeta (GET /debts/{id}/statement). Devuelve
 * `null` sin error si la tarjeta todavía no tiene día de corte/días de pago
 * configurados (400 esperado, no un fallo real) -- el llamador simplemente
 * no muestra la sección de ciclo en ese caso.
 */
export function useDebtStatement(debtId: number, kind: 'loan' | 'credit_card') {
  const [data, setData] = useState<DebtStatement | null>(null);
  const [loading, setLoading] = useState(kind === 'credit_card');

  // Al crear una transacción desde el botón flotante, esto hace que
  // la pantalla activa vuelva a pedir sus datos sin recargar la página.
  const dataVersion = useDataVersion();

  useEffect(() => {
    if (kind !== 'credit_card') {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/debts/${debtId}/statement`);
        if (!cancelled) setData(data);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debtId, kind, dataVersion]);

  return { data, loading };
}
