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
  source?: "all" | "credit_card" | "account"; // ✅ nuevo
}

export const useTransactions = (options?: UseTransactionsOptions, page = 1) => {
  const [transactions, setTransactions] = useState<TransactionWithCategoryRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      // Prepara los parámetros de forma limpia
      const params: Record<string, any> = { page };

      if (options?.startDate) params.startDate = options.startDate;
      if (options?.endDate) params.endDate = options.endDate;
      if (options?.categoryId) params.categoryId = options.categoryId;
      if (options?.type) params.type = options.type;
      if (options?.source && options.source !== "all") params.source = options.source; 

      const { data } = await api.get("/transactions/with-category", { params });
      setTransactions(data.items);
      setTotalPages(data.totalPages);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Error al cargar transacciones");
    } finally {
      setLoading(false);
    }
  }, [
    options?.startDate,
    options?.endDate,
    options?.categoryId,
    options?.type,
    options?.source,
    page,
  ]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, loading, refresh: fetchTransactions, totalPages };
};