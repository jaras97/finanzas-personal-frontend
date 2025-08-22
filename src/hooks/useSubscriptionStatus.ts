// src/hooks/useSubscriptionStatus.ts
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '@/lib/api';
import type { SubscriptionStatusRead } from '@/types';
import axios from 'axios';

export type SubscriptionStatus =
  | 'loading'
  | 'none'
  | 'expired'
  | 'inactive'
  | 'expiring_soon'
  | 'active';

type Options = {
  /** Días para considerar “por expirar”. Default: 7 */
  expiringSoonThresholdDays?: number;
};

function safeParseDate(d?: string | null): Date | null {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
}

export function useSubscriptionStatus(options?: Options) {
  const threshold = options?.expiringSoonThresholdDays ?? 7;

  const [status, setStatus] = useState<SubscriptionStatus>('loading');
  const [subscription, setSubscription] = useState<SubscriptionStatusRead | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [initialized, setInitialized] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const compute = useCallback((data: SubscriptionStatusRead | null) => {
    if (!data) {
      setStatus('none');
      setSubscription(null);
      setDaysLeft(null);
      return;
    }

    const now = new Date();
    const endDate = safeParseDate(data.end_date);
    const diffDays =
      endDate ? (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) : null;

    setSubscription(data);
    setDaysLeft(diffDays);

    // ✅ 1) PRIORIDAD MÁXIMA: vencida por fecha (aunque is_active sea true)
    if (endDate && endDate < now) {
      setStatus('expired');
      return;
    }

    // ✅ 2) Inactiva de manera administrativa
    if (!data.is_active) {
      setStatus('inactive');
      return;
    }

    // ✅ 3) Por expirar
    if (diffDays !== null && diffDays >= 0 && diffDays < threshold) {
      setStatus('expiring_soon');
      return;
    }

    // ✅ 4) Activa
    setStatus('active');
  }, [threshold]);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const { data } = await api.get<SubscriptionStatusRead>('/subscriptions/me', {
        signal: controller.signal,
      });
      if (!mountedRef.current) return;
      compute(data);
      setInitialized(true);
    } catch (error: unknown) {
      if (!mountedRef.current) return;

      // Ignora cancelaciones por abort
      if (
        axios.isAxiosError(error) &&
        (error.code === 'ERR_CANCELED' ||
          (error as any).name === 'CanceledError' ||
          error.message === 'canceled')
      ) {
        return;
      }

      if (axios.isAxiosError(error)) {
        const code = error.response?.status;

        // Solo “none” en 401/404 (no autenticado / sin suscripción creada)
        if (code === 401 || code === 404) {
          setStatus('none');
          setSubscription(null);
          setDaysLeft(null);
          setInitialized(true);
          return;
        }

        // Otros errores: no degradar; conserva estado previo
        setStatus((prev) => (prev === 'loading' ? 'loading' : prev));
        setInitialized(true);
        return;
      }

      // Errores no Axios
      setStatus((prev) => (prev === 'loading' ? 'loading' : prev));
      setInitialized(true);
    }
  }, [compute]);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, [refresh]);

  const flags = useMemo(() => ({
    isLoading: status === 'loading',
    isActive: status === 'active',
    isNone: status === 'none',
    isInactive: status === 'inactive',
    isExpired: status === 'expired',
    isExpiringSoon: status === 'expiring_soon',
  }), [status]);

  return { status, subscription, daysLeft, refresh, initialized, ...flags };
}
