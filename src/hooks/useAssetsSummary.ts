import { useState, useEffect } from "react";
import api from "@/lib/api";
import axios from "axios";

interface AssetsSummary {
  total_savings: Record<"COP" | "USD" | "EUR", number>;
  total_investments: Record<"COP" | "USD" | "EUR", number>;
  total_assets: Record<"COP" | "USD" | "EUR", number>;
}

export function useAssetsSummary() {
  const [data, setData] = useState<AssetsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssetsSummary() {
      try {
        setLoading(true);
        const res = await api.get("/summary-extra/assets-summary");
        setData(res.data);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err?.response?.data?.detail || "Error al cargar resumen de activos");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchAssetsSummary();
  }, []);

  return { data, loading, error };
}