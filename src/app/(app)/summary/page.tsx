'use client';

import { useMemo, useState } from 'react';
import { useSummary } from '@/hooks/useSummary';
import { useAssetsSummary } from '@/hooks/useAssetsSummary';
import { useLiabilitiesSummary } from '@/hooks/useLiabilitiesSummary';
import { useNetWorthSummary } from '@/hooks/useNetWorthSummary';
import { useCashFlowSummary } from '@/hooks/useCashFlowSummary';
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
    [dateRange.startDate, dateRange.endDate],
  );

  const { data: summary, loading, error } = useSummary(filters);
  const { data: assets, loading: loadingAssets } = useAssetsSummary();
  const { data: liabilities, loading: loadingLiabilities } =
    useLiabilitiesSummary();
  const { data: netWorth, loading: loadingNetWorth } = useNetWorthSummary();
  const { data: cashFlow, loading: loadingCashFlow } = useCashFlowSummary(
    filters.dateRange.from,
    filters.dateRange.to,
  );

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

      {/* ✅ Sección principal de tarjetas */}
      {!loading &&
        !loadingAssets &&
        !loadingLiabilities &&
        !loadingNetWorth &&
        summary &&
        assets &&
        liabilities &&
        netWorth && (
          <div className='space-y-4'>
            <h2 className='text-lg font-semibold mt-4'>
              Resumen General del Período
            </h2>
            <p className='text-sm text-muted-foreground'>
              Esta sección muestra{' '}
              <strong>ingresos, gastos, ahorro (balance) y patrimonio</strong>{' '}
              en el período seleccionado. Los{' '}
              <strong>
                gastos incluyen compras con tarjeta y gastos generales
              </strong>{' '}
              (no pagos de deuda ni transferencias). El ahorro aquí refleja la
              diferencia entre ingresos y gastos. Para ver el ahorro real
              considerando movimientos de caja, consulta la sección de{' '}
              <strong>Flujo de Caja</strong>.
            </p>

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
                  label: 'Ahorro (Balance) en el período',
                  color: 'text-green-600',
                  getValue: (currency: Currency) => {
                    const s = summary[currency];
                    return formatCurrency(s?.balance || 0, currency);
                  },
                },
                {
                  label: '% de Ahorro',
                  color: 'text-yellow-600',
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
                  label: 'Total en Cuentas',
                  color: 'text-blue-600',
                  getValue: (currency: Currency) =>
                    formatCurrency(
                      assets.total_assets[currency] || 0,
                      currency,
                    ),
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
          </div>
        )}

      {/* ✅ Nueva sección de Flujo de Caja */}
      {!loadingCashFlow && cashFlow && (
        <div className='space-y-4'>
          <h2 className='text-lg font-semibold mt-8'>
            Flujo de Caja del Período
          </h2>
          <p className='text-sm text-muted-foreground'>
            El flujo de caja muestra el movimiento real de dinero en tus cuentas
            durante este período. No incluye compras con tarjeta hasta que las
            pagues, ayudándote a conocer tu liquidez real.
          </p>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {[
              {
                label: 'Ingresos de Caja',
                color: 'text-green-600',
                getValue: (currency: Currency) =>
                  formatCurrency(
                    cashFlow[currency]?.total_income || 0,
                    currency,
                  ),
              },
              {
                label: 'Egresos de Caja',
                color: 'text-red-600',
                getValue: (currency: Currency) =>
                  formatCurrency(
                    cashFlow[currency]?.total_expense || 0,
                    currency,
                  ),
              },
              {
                label: 'Pagos de Deudas',
                color: 'text-yellow-600',
                getValue: (currency: Currency) =>
                  formatCurrency(
                    cashFlow[currency]?.total_debt_payments || 0,
                    currency,
                  ),
              },
              {
                label: 'Flujo Neto de Caja',
                color: 'text-green-600',
                getValue: (currency: Currency) =>
                  formatCurrency(
                    cashFlow[currency]?.net_cash_flow || 0,
                    currency,
                  ),
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
