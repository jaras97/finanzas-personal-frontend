'use client';

import { useMemo, useState } from 'react';
import { useSummary } from '@/hooks/useSummary';
import { useAssetsSummary } from '@/hooks/useAssetsSummary';
import { useLiabilitiesSummary } from '@/hooks/useLiabilitiesSummary';
import { useNetWorthSummary } from '@/hooks/useNetWorthSummary';
import { Card, CardContent } from '@/components/ui/card';
import { Loader, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { SummaryPieChart } from '@/components/chart/SummaryPieChart';
import { SummaryLineChart } from '@/components/chart/SummaryLineChart';
import { DateRangePicker } from '@/components/ui/date-range-picker';

const currencies = ['COP', 'USD'] as const;
type Currency = (typeof currencies)[number];

export default function ResumenPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });

  const filters = useMemo(
    () => ({
      dateRange: { from: dateRange.startDate, to: dateRange.endDate },
      type: 'all' as const,
    }),
    [dateRange.startDate, dateRange.endDate.getTime()],
  );

  const { data: summary, loading, error } = useSummary(filters);
  const { data: assets, loading: loadingAssets } = useAssetsSummary();
  const { data: liabilities, loading: loadingLiabilities } =
    useLiabilitiesSummary();
  const { data: netWorth, loading: loadingNetWorth } = useNetWorthSummary();

  return (
    <div className='p-4 max-w-5xl mx-auto space-y-6'>
      <h1 className='text-2xl font-semibold'>Resumen Financiero</h1>

      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
        disabled={loading}
      />

      {loading && (
        <div className='flex justify-center items-center h-40'>
          <Loader className='animate-spin w-8 h-8 text-primary' />
        </div>
      )}

      {error && (
        <div className='flex items-center text-red-600 gap-2'>
          <AlertCircle className='w-5 h-5' />
          <p>{error}</p>
        </div>
      )}

      {/* ✅ Cards unificadas con ingresos, gastos y ahorro */}
      {!loading &&
        !loadingAssets &&
        !loadingLiabilities &&
        !loadingNetWorth &&
        summary &&
        assets &&
        liabilities &&
        netWorth && (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {[
              {
                label: 'Ingresos en el período',
                color: 'text-green-600',
                getValue: (currency: Currency) =>
                  formatCurrency(
                    summary[currency]?.total_income || 0,
                    currency,
                  ),
              },
              {
                label: 'Gastos en el período',
                color: 'text-red-600',
                getValue: (currency: Currency) =>
                  formatCurrency(
                    summary[currency]?.total_expense || 0,
                    currency,
                  ),
              },
              {
                label: 'Ahorro en el período',
                color: 'text-green-600',
                getValue: (currency: Currency) => {
                  const s = summary[currency];
                  const balance = s ? s.balance : 0;
                  return formatCurrency(balance, currency);
                },
              },
              {
                label: '% de Ahorro',
                color: 'text-green-600',
                getValue: (currency: Currency) => {
                  const s = summary[currency];
                  if (s && s.total_income > 0) {
                    const percentage = (s.balance / s.total_income) * 100;
                    return `${percentage.toFixed(2)}%`;
                  }
                  return '0%';
                },
              },
              {
                label: 'Cuentas de Ahorro',
                color: 'text-blue-600',
                getValue: (currency: Currency) =>
                  formatCurrency(assets.total_savings[currency] || 0, currency),
              },
              {
                label: 'Inversiones',
                color: 'text-blue-600',
                getValue: (currency: Currency) =>
                  formatCurrency(
                    assets.total_investments[currency] || 0,
                    currency,
                  ),
              },
              {
                label: 'Total Activos',
                color: 'text-blue-600',
                getValue: (currency: Currency) =>
                  formatCurrency(assets.total_assets[currency] || 0, currency),
              },
              {
                label: 'Deudas Activas',
                color: 'text-red-600',
                getValue: (currency: Currency) =>
                  formatCurrency(
                    liabilities.total_liabilities[currency] || 0,
                    currency,
                  ),
              },
              {
                label: 'Patrimonio Neto',
                color: 'text-green-600',
                getValue: (currency: Currency) =>
                  formatCurrency(netWorth[currency].net_worth || 0, currency),
              },
              {
                label: 'Ratio Deuda/Activo',
                color: 'text-yellow-600',
                getValue: (currency: Currency) =>
                  `${netWorth[currency].debt_ratio?.toFixed(2) || '0'}%`,
              },
            ].map(({ label, color, getValue }) => (
              <Card key={label}>
                <CardContent className='p-4 space-y-1'>
                  <p className='text-sm text-muted-foreground'>{label}</p>
                  <div className='space-y-0.5'>
                    {currencies.map((currency) => (
                      <p
                        key={currency}
                        className={cn('text-base font-semibold', color)}
                      >
                        {currency}: {getValue(currency)}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

      {/* ✅ Gráficas separadas por moneda */}
      {summary &&
        currencies.map((currency) => (
          <div key={currency} className='space-y-4'>
            <h2 className='text-lg font-semibold mt-6'>
              Gráficas en {currency}
            </h2>

            <SummaryLineChart
              data={(summary[currency]?.daily_evolution || []).map((item) => ({
                date: item.date,
                income: item.total_income,
                expense: item.total_expense,
              }))}
            />

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
              <SummaryPieChart
                data={(summary[currency]?.expense_by_category || []).map(
                  (item) => ({
                    name: item.category_name,
                    value: item.total,
                  }),
                )}
                title={`Gastos por Categoría (${currency})`}
              />
              <SummaryPieChart
                data={(summary[currency]?.income_by_category || []).map(
                  (item) => ({
                    name: item.category_name,
                    value: item.total,
                  }),
                )}
                title={`Ingresos por Categoría (${currency})`}
              />
            </div>

            {summary[currency]?.overspending_alert && (
              <div className='p-4 rounded-md bg-red-100 text-red-800 text-center font-medium'>
                Alerta: Tus gastos superan tus ingresos en este período en{' '}
                {currency}.
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
