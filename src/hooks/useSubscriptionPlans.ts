'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import type { SubscriptionPlan } from '@/types';

export function useSubscriptionPlans(includeInactive = false) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<SubscriptionPlan[]>(
        `/admin/subscription-plans${includeInactive ? '?include_inactive=true' : ''}`,
      );
      setPlans(data);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { plans, loading, refresh };
}
