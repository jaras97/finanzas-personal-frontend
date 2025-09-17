import { useState, useEffect } from "react";
import api from "@/lib/api";
import axios from "axios";
import { currencyType } from "@/types";

interface LiabilitiesSummary {
  total_liabilities: Record<currencyType, number>;
}

export function useLiabilitiesSummary() {
  const [data, setData] = useState<LiabilitiesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLiabilitiesSummary() {
      try {
        setLoading(true);
        const res = await api.get("/summary-extra/liabilities-summary");
        setData(res.data);
      } catch (err) {
         if (axios.isAxiosError(err)) {
           setError(err?.response?.data?.detail || "Error al cargar resumen de deudas");
          }
      } finally {
        setLoading(false);
      }
    }

    fetchLiabilitiesSummary();
  }, []);

  return { data, loading, error };
}