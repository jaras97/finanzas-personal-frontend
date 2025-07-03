'use client';

import useSWR from 'swr';
import api from '@/lib/api';
import { Debt } from '@/types';

export function useDebts() {
  const { data, error, mutate, isLoading } = useSWR('/debts', async (url) => {
    const response = await api.get<Debt[]>(url);
    return response.data;
  });

  return {
    debts: data || [],
    loading: isLoading,
    error,
    refresh: mutate,
  };
}