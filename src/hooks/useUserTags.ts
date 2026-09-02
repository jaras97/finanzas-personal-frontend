'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import type { UserTag } from '@/types';

export function useUserTags() {
  const [tags, setTags] = useState<UserTag[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<UserTag[]>('/admin/tags');
      setTags(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { tags, loading, refresh };
}
