import { useState, useEffect } from "react";
import api from "@/lib/api";
import axios from "axios";
import { currencyType } from "@/types";
import { useDataVersion } from '@/lib/dataRefresh';

interface AssetsSummary {
  total_savings: Record<currencyType, number>;
  total_investments: Record<currencyType, number>;
  total_assets: Record<currencyType, number>;
}

export function useAssetsSummary() {
  const [data, setData] = useState<AssetsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Al crear una transacción desde el botón flotante, esto hace que
  // la pantalla activa vuelva a pedir sus datos sin recargar la página.
  const dataVersion = useDataVersion();

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
  }, [dataVersion]);

  return { data, loading, error };
}