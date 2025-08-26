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
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { formatDayLabel } from '@/lib/formatDayLabel';
import { CurrencyToggle } from '@/components/ui/CurrencyToggle';
import { AreaIncomeExpense } from '@/components/chart/AreaIncomeExpense';
import { DonutByCategory } from '@/components/chart/DonutByCategory';

type Currency = 'COP' | 'USD' | 'EUR';

export default function SummaryPage() {
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(today.getFullYear(), today.getMonth(), 1),
    endDate: today,
  });
  const [currency, setCurrency] = useState<Currency>('COP');

  const filters = useMemo(
    () => ({
      dateRange: { from: dateRange.startDate, to: dateRange.endDate },
      type: 'all' as const,
    }),
    [dateRange.startDate, dateRange.endDate],
  );

  const { data: summary, loading, error } = useSummary(filters);
  const { data: assets, loading: lA } = useAssetsSummary();
  const { data: liabilities, loading: lL } = useLiabilitiesSummary();
  const { data: netWorth, loading: lN } = useNetWorthSummary();
  const { data: cashFlow, loading: lC } = useCashFlowSummary(
    filters.dateRange.from,
    filters.dateRange.to,
  );

  const hour = today.getHours();
  const greeting =
    hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  const isBusy = loading || lA || lL || lN || lC;
  const s = summary?.[currency];

  return (
    <div className='space-y-6'>
      {/* Saludo + filtros */}
      <div className='flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between'>
        <div className='min-w-0'>
          <h1 className='text-2xl font-semibold'>{greeting} 👋</h1>
          <p className='text-sm text-muted-foreground'>
            Aquí tienes tu resumen financiero.
          </p>
        </div>

        <div className='flex flex-col sm:flex-row gap-3 sm:items-center w-full md:w-auto'>
          <div className='w-full sm:w-[min(420px,100%)]'>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              disabled={isBusy}
            />
          </div>
          <div className='w-full sm:w-40'>
            <CurrencyToggle
              value={currency}
              onChange={(c) => setCurrency(c as Currency)}
              disabled={isBusy}
            />
          </div>
        </div>
      </div>

      {/* Estado */}
      {isBusy && (
        <div className='grid place-items-center h-40'>
          <Loader className='animate-spin w-8 h-8 text-primary' />
        </div>
      )}
      {error && (
        <div className='flex items-center text-red-600 gap-2'>
          <AlertCircle className='w-5 h-5' />
          <p>{error}</p>
        </div>
      )}

      {/* 1) KPIs */}
      {!isBusy && s && (
        <section className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          {[
            {
              label: 'Balance del período',
              value: formatCurrency(s.balance, currency),
              variant: 'kpi-balance' as const,
            },
            {
              label: 'Ingresos',
              value: formatCurrency(s.total_income, currency),
              variant: 'kpi-balance' as const,
            },
            {
              label: 'Gastos',
              value: formatCurrency(s.total_expense, currency),
              variant: 'kpi-balance' as const,
            },
          ].map(({ label, value, variant }) => (
            <Card key={label} variant={variant} interactive>
              <CardContent className='py-5 px-6'>
                <p className='text-sm text-slate-700'>{label}</p>
                <p className='mt-1 text-xl font-semibold tracking-tight'>
                  {value}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {/* 2) Totales (superficie blanca) */}
      {!isBusy && assets && liabilities && netWorth && (
        <section className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          {[
            {
              label: 'Total en cuentas',
              value: formatCurrency(
                assets.total_assets[currency] || 0,
                currency,
              ),
              variant: 'kpi-income' as const,
            },
            {
              label: 'Total deudas',
              value: formatCurrency(
                liabilities.total_liabilities[currency] || 0,
                currency,
              ),
              variant: 'kpi-income' as const,
            },
            {
              label: 'Patrimonio neto',
              value: formatCurrency(
                netWorth[currency]?.net_worth || 0,
                currency,
              ),
              variant: 'kpi-income' as const,
            },
          ].map(({ label, value, variant }) => (
            <Card key={label} variant={variant}>
              <CardContent className='p-5'>
                <p className='text-sm text-muted-foreground'>{label}</p>
                <p className='text-xl font-semibold'>{value}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {/* 3) Flujo de caja (paneles semánticos suaves) */}
      {!isBusy && cashFlow && (
        <section className='grid grid-cols-1 sm:grid-cols-4 gap-4'>
          {[
            {
              l: 'Ingresos de caja',
              v: cashFlow[currency]?.total_income || 0,
              variant: 'panel-warning' as const,
            },
            {
              l: 'Egresos de caja',
              v: cashFlow[currency]?.total_expense || 0,
              variant: 'panel-warning' as const,
            },
            {
              l: 'Pagos de deudas',
              v: cashFlow[currency]?.total_debt_payments || 0,
              variant: 'panel-warning' as const,
            },
            {
              l: 'Flujo neto',
              v: cashFlow[currency]?.net_cash_flow || 0,
              // verde si >= 0, rojo si < 0
              variant:
                (cashFlow[currency]?.net_cash_flow || 0) >= 0
                  ? ('panel-positive' as const)
                  : ('panel-negative' as const),
            },
          ].map(({ l, v, variant }) => (
            <Card key={l} variant={variant}>
              <CardContent className='p-5'>
                <p className='text-sm text-slate-700'>{l}</p>
                <p className='text-xl font-semibold'>
                  {formatCurrency(v, currency)}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {/* 4) Gráficas */}
      {!isBusy && s && (
        <section className='space-y-4'>
          <Card variant='surface'>
            <CardContent className='p-4'>
              <AreaIncomeExpense
                data={(s.daily_evolution || []).map((d) => ({
                  date: formatDayLabel(d.date, 'dd/MM'),
                  income: d.total_income,
                  expense: d.total_expense,
                }))}
              />
            </CardContent>
          </Card>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <Card variant='surface'>
              <CardContent className='p-4'>
                <DonutByCategory
                  title={`Gastos por categoría (${currency})`}
                  data={(s.expense_by_category || []).map((i) => ({
                    name: i.category_name,
                    value: i.total,
                  }))}
                />
              </CardContent>
            </Card>

            <Card variant='surface'>
              <CardContent className='p-4'>
                <DonutByCategory
                  title={`Ingresos por categoría (${currency})`}
                  data={(s.income_by_category || []).map((i) => ({
                    name: i.category_name,
                    value: i.total,
                  }))}
                />
              </CardContent>
            </Card>
          </div>

          {s.overspending_alert && (
            <div className='p-4 rounded-xl bg-rose-50 text-rose-700 text-center font-medium'>
              Tus gastos superan tus ingresos en este período ({currency}).
            </div>
          )}
        </section>
      )}
    </div>
  );
}
