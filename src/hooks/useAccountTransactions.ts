import { useEffect, useState } from "react";
import api from "@/lib/api";
import { TransactionWithCategoryRead } from "@/types";
import { toast } from "sonner";
import axios from "axios";
import { useDataVersion } from '@/lib/dataRefresh';

export function useAccountTransactions(accountId: number) {
  const [transactions, setTransactions] = useState<TransactionWithCategoryRead[]>([]);
  const [loading, setLoading] = useState(false);

  // Al crear una transacción desde el botón flotante, esto hace que
  // la pantalla activa vuelva a pedir sus datos sin recargar la página.
  const dataVersion = useDataVersion();

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
  }, [accountId, dataVersion]);

  return { transactions, loading };
}