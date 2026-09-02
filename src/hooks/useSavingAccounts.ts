"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { SavingAccount } from "@/types";
import axios from "axios";
import { useDataVersion } from '@/lib/dataRefresh';

export const useSavingAccounts = () => {
  const [accounts, setAccounts] = useState<SavingAccount[]>([]);
  const [loading, setLoading] = useState(false);

  // Al crear una transacción desde el botón flotante, esto hace que
  // la pantalla activa vuelva a pedir sus datos sin recargar la página.
  const dataVersion = useDataVersion();

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/saving-accounts");
      setAccounts(data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error?.response?.data?.detail || "Error al cargar cuentas");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [dataVersion]);

  return {
    accounts,
    loading,
    refresh: fetchAccounts,
  };
};