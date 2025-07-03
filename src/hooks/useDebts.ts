'use client';

import useSWR from 'swr';
import api from '@/lib/api';
import { Debt } from '@/types';

const fetcher = (url: string) => api.get<Debt[]>(url).then(res => res.data);

export function useDebts() {
  const { data, error, mutate, isLoading } = useSWR('/debts', fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  return {
    debts: data || [],
    loading: isLoading,
    error: error as Error | undefined,
    refresh: mutate,
  };
}