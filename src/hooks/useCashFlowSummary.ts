import { useState, useEffect } from "react";
import api from "@/lib/api";
import { buildDateParams } from "@/lib/dateParams";
import { extractErrorMessage } from "@/lib/extractErrorMessage";

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

        const params = buildDateParams(startDate, endDate);

        const response = await api.get(`/cash-flow?${params.toString()}`);
        setData(response.data);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    fetchCashFlow();
  }, [startDate, endDate]);

  return { data, loading, error };
}
