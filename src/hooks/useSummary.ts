import api from "@/lib/api";
import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { extractErrorMessage } from "@/lib/extractErrorMessage";
import { buildDateParamsFromRange } from "@/lib/dateParams";
import { currencyType } from "@/types";
import { useDataVersion } from '@/lib/dataRefresh';

export interface CategorySummary {
  category_id: number;
  category_name: string;
  total: number;
  percentage: number;
  /** Clave de paleta del grupo; evita cruzar con /categories para pintar. */
  color?: string | null;
  icon?: string | null;
  previous_total: number;
  /** null = no hay base de comparación. Un "+∞%" no informa. */
  delta_percentage: number | null;
  /** Las hojas del grupo. Viajan acá para que el drill-down no pida nada. */
  children: CategorySummary[];
}

/** Id sintético de la línea «Sin categorizar» (ver SIN_CATEGORIA_ID en el backend). */
export const SIN_CATEGORIA_ID = 0;
interface DailyEvolution { date: string; total_income: number; total_expense: number; }
interface DaySummary { date: string; total_income: number; total_expense: number; }
interface SummaryData {
  total_income: number; total_expense: number; balance: number; overspending_alert: boolean;
  expense_by_category: CategorySummary[]; income_by_category: CategorySummary[];
  daily_evolution: DailyEvolution[]; top_expense_category: CategorySummary | null;
  top_income_category: CategorySummary | null; top_expense_day: DaySummary | null; top_income_day: DaySummary | null;
}

export function useSummary(filters: {
  dateRange: DateRange;
  type?: "income" | "expense" | "all";
  categoryId?: number;
}) {
  const [data, setData] = useState<Record<currencyType, SummaryData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Al crear una transacción desde el botón flotante, esto hace que
  // la pantalla activa vuelva a pedir sus datos sin recargar la página.
  const dataVersion = useDataVersion();

  useEffect(() => {
    async function fetchSummary() {
      try {
        setLoading(true);
        setError(null);

        const params = buildDateParamsFromRange(filters.dateRange, {
          type: filters.type && filters.type !== "all" ? filters.type : undefined,
          categoryId: typeof filters.categoryId === "number" ? filters.categoryId : undefined,
        });

        params.set("tz", Intl.DateTimeFormat().resolvedOptions().timeZone);

       
        const res = await api.get(`/summary?${params.toString()}`);
        setData(res.data);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [filters, dataVersion]);

  return { data, loading, error };
}
