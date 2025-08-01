import api from "@/lib/api";
import { toLocalDateString } from "@/lib/date";
import axios from "axios";
import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";

interface CategorySummary {
  category_id: number;
  category_name: string;
  total: number;
  percentage: number;
}

interface DailyEvolution {
  date: string;
  total_income: number;
  total_expense: number;
}

interface DaySummary {
  date: string;
  total_income: number;
  total_expense: number;
}

interface SummaryData {
  total_income: number;
  total_expense: number;
  balance: number;
  overspending_alert: boolean;
  expense_by_category: CategorySummary[];
  income_by_category: CategorySummary[];
  daily_evolution: DailyEvolution[];
  top_expense_category: CategorySummary | null;
  top_income_category: CategorySummary | null;
  top_expense_day: DaySummary | null;
  top_income_day: DaySummary | null;
}

type Currency = "COP" | "USD" | "EUR";

export function useSummary(filters: {
  dateRange: DateRange;
  type?: "income" | "expense" | "all";
  categoryId?: number;
}) {
  const [data, setData] = useState<Record<Currency, SummaryData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filters.dateRange.from) {
          params.append("start_date", toLocalDateString(filters.dateRange.from));
        }
        if (filters.dateRange.to) {
          params.append("end_date", toLocalDateString(filters.dateRange.to));
        }
        if (filters.type && filters.type !== "all") {
          params.append("type", filters.type);
        }
        if (filters.categoryId) {
          params.append("categoryId", filters.categoryId.toString());
        }

        const res = await api.get(`/summary?${params.toString()}`);
        setData(res.data);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err?.response?.data?.detail || "Error al cargar resumen");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [filters]);

  return { data, loading, error };
}