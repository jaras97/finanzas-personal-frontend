import api from "@/lib/api";
import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { extractErrorMessage } from "@/lib/extractErrorMessage";
import { buildDateParamsFromRange } from "@/lib/dateParams";

interface CategorySummary { category_id: number; category_name: string; total: number; percentage: number; }
interface DailyEvolution { date: string; total_income: number; total_expense: number; }
interface DaySummary { date: string; total_income: number; total_expense: number; }
interface SummaryData {
  total_income: number; total_expense: number; balance: number; overspending_alert: boolean;
  expense_by_category: CategorySummary[]; income_by_category: CategorySummary[];
  daily_evolution: DailyEvolution[]; top_expense_category: CategorySummary | null;
  top_income_category: CategorySummary | null; top_expense_day: DaySummary | null; top_income_day: DaySummary | null;
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
        setError(null);

        const params = buildDateParamsFromRange(filters.dateRange, {
          type: filters.type && filters.type !== "all" ? filters.type : undefined,
          categoryId: typeof filters.categoryId === "number" ? filters.categoryId : undefined,
        });

        const res = await api.get(`/summary?${params.toString()}`);
        setData(res.data);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [filters]);

  return { data, loading, error };
}
