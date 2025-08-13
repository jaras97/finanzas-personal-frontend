"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { TransactionWithCategoryRead } from "@/types";
import { toast } from "sonner";
import axios from "axios";
import { toUtcDayBoundsFromISOStrings } from "@/lib/dateParams";

interface UseTransactionsOptions {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  type?: "income" | "expense";
  source?: "all" | "credit_card" | "account";
  
}

type TransactionQueryParams = {
  page: number;
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  type?: "income" | "expense";
  source?: string;
};

export const useTransactions = (options?: UseTransactionsOptions, page = 1) => {
  const [transactions, setTransactions] = useState<TransactionWithCategoryRead[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: TransactionQueryParams = { page };
      const { start, end } = toUtcDayBoundsFromISOStrings(
        options?.startDate,
        options?.endDate
      );
      if (start) params.startDate = start;
      if (end) params.endDate = end;
      

      if (options?.categoryId) params.categoryId = options.categoryId;
      if (options?.type) params.type = options.type;
      if (options?.source && options.source !== "all") params.source = options.source;

      const { data } = await api.get("/transactions/with-category", { params });
      console.log('data', data);
      setTransactions(data.items);
      setTotalPages(data.totalPages);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error?.response?.data?.detail || "Error al cargar transacciones");
      }
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