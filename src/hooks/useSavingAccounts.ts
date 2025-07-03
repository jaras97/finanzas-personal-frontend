"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { SavingAccount } from "@/types";

export const useSavingAccounts = () => {
  const [accounts, setAccounts] = useState<SavingAccount[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/saving-accounts");
      setAccounts(data);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Error al cargar cuentas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  return {
    accounts,
    loading,
    refresh: fetchAccounts,
  };
};