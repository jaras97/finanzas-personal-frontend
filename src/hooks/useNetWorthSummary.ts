import { useState, useEffect } from "react";
import api from "@/lib/api";
import axios from "axios";
import { currencyType } from "@/types";
import { useDataVersion } from '@/lib/dataRefresh';

interface NetWorthDetail {
  total_assets: number;
  total_liabilities: number;
  net_worth: number;
  debt_ratio: number;
}

type NetWorthSummary = Record<currencyType, NetWorthDetail>;

export function useNetWorthSummary() {
  const [data, setData] = useState<NetWorthSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Al crear una transacción desde el botón flotante, esto hace que
  // la pantalla activa vuelva a pedir sus datos sin recargar la página.
  const dataVersion = useDataVersion();

  useEffect(() => {
    async function fetchNetWorthSummary() {
      try {
        setLoading(true);
        const res = await api.get("/summary-extra/net-worth-summary");
        setData(res.data);
      } catch (err) {
          if (axios.isAxiosError(err)) {
            setError(err?.response?.data?.detail || "Error al cargar resumen patrimonial");
          }
      } finally {
        setLoading(false);
      }
    }

    fetchNetWorthSummary();
  }, [dataVersion]);

  return { data, loading, error };
}