import { useState, useEffect } from "react";
import api from "@/lib/api";
import axios from "axios";

interface CashFlowSummary {
  total_income: number;
  total_expense: number;
  total_debt_payments: number;
  net_cash_flow: number;
}

export function useCashFlowSummary(startDate?: Date, endDate?: Date) {
  const [data, setData] = useState<Record<string, CashFlowSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCashFlow() {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (startDate) {
          params.append("start_date", startDate.toISOString().split("T")[0]);
        }
        if (endDate) {
          params.append("end_date", endDate.toISOString().split("T")[0]);
        }

        const response = await api.get(`/cash-flow?${params.toString()}`);
        setData(response.data);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err?.response?.data?.detail || "Error al cargar flujo de caja");
        } else {
          setError("Error inesperado al cargar flujo de caja");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchCashFlow();
  }, [startDate, endDate]);

  return { data, loading, error };
}