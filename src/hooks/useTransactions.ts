"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { TransactionWithCategoryRead } from "@/types";
import { toast } from "sonner";

interface UseTransactionsOptions {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  type?: "income" | "expense";
}

export const useTransactions = (options?: UseTransactionsOptions, page = 1) => {
  const [transactions, setTransactions] = useState<TransactionWithCategoryRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...options, page };
      const { data } = await api.get("/transactions/with-category", { params });
      setTransactions(data.items);
      setTotalPages(data.totalPages);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Error al cargar transacciones");
    } finally {
      setLoading(false);
    }
  }, [options?.startDate, options?.endDate, options?.categoryId, options?.type, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, loading, refresh: fetchTransactions, totalPages };
};