import { useEffect, useState } from "react";
import api from "@/lib/api";
import { TransactionWithCategoryRead } from "@/types";
import { toast } from "sonner";
import axios from "axios";

export function useAccountTransactions(accountId: number) {
  const [transactions, setTransactions] = useState<TransactionWithCategoryRead[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accountId) return;

    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/saving-accounts/${accountId}/transactions`);
        setTransactions(data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          toast.error(error?.response?.data?.detail || "Error al cargar movimientos de la cuenta");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [accountId]);

  return { transactions, loading };
}