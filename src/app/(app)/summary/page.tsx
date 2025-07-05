'use client';

import { useMemo, useState } from 'react';
import { useSummary } from '@/hooks/useSummary';

import { Card, CardContent } from '@/components/ui/card';
import { Loader, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { SummaryPieChart } from '@/components/chart/SummaryPieChart';
import { SummaryLineChart } from '@/components/chart/SummaryLineChart';
import { DateRangePicker } from '@/components/ui/date-range-picker';

export default function ResumenPage() {
  const [dateRange, setDateRange] = useState<{
    startDate: Date;
    endDate: Date;
  }>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
  });

  const filters = useMemo(
    () => ({
      dateRange: {
        from: dateRange.startDate,
        to: dateRange.endDate,
      },
      type: 'all' as 'all',
    }),
    [dateRange.startDate.getTime(), dateRange.endDate.getTime()],
  );

  const { data: summary, loading, error } = useSummary(filters);

  const expenseChartData =
    summary?.expense_by_category.map((item) => ({
      name: item.category_name,
      value: item.total,
    })) || [];

  const incomeChartData =
    summary?.income_by_category.map((item) => ({
      name: item.category_name,
      value: item.total,
    })) || [];

  const lineChartData =
    summary?.daily_evolution.map((item) => ({
      date: item.date,
      income: item.total_income,
      expense: item.total_expense,
    })) || [];

  return (
    <div className='p-4 max-w-5xl mx-auto space-y-6'>
      <h1 className='text-2xl font-semibold'>Resumen Financiero</h1>

      {/* Filtros */}
      <DateRangePicker
        value={dateRange}
        onChange={setDateRange}
        disabled={loading}
      />

      {/* Loader */}
      {loading && (
        <div className='flex justify-center items-center h-40'>
          <Loader className='animate-spin w-8 h-8 text-primary' />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className='flex items-center text-red-600 gap-2'>
          <AlertCircle className='w-5 h-5' />
          <p>{error}</p>
        </div>
      )}

      {/* Contenido */}
      {summary && (
        <div className='space-y-6'>
          {/* Resumen Totales */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Card>
              <CardContent className='p-4'>
                <p className='text-sm text-muted-foreground'>Total Ingresos</p>
                <p className='text-xl font-bold text-green-600'>
                  {formatCurrency(summary.total_income)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4'>
                <p className='text-sm text-muted-foreground'>Total Gastos</p>
                <p className='text-xl font-bold text-red-600'>
                  {formatCurrency(summary.total_expense)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4'>
                <p className='text-sm text-muted-foreground'>Balance</p>
                <p
                  className={cn(
                    'text-xl font-bold',
                    summary.balance >= 0 ? 'text-green-600' : 'text-red-600',
                  )}
                >
                  {formatCurrency(summary.balance)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficas */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <SummaryPieChart
              data={expenseChartData}
              title='Gastos por Categoría'
            />
            <SummaryPieChart
              data={incomeChartData}
              title='Ingresos por Categoría'
            />
          </div>

          <SummaryLineChart data={lineChartData} />

          {/* Insights */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Card>
              <CardContent className='p-4'>
                <p className='text-sm text-muted-foreground'>
                  Categoría con mayor gasto
                </p>
                <p className='text-lg font-medium'>
                  {summary.top_expense_category?.category_name || 'N/A'}
                </p>
                <p className='text-sm text-red-600'>
                  {formatCurrency(summary.top_expense_category?.total || 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4'>
                <p className='text-sm text-muted-foreground'>
                  Categoría con mayor ingreso
                </p>
                <p className='text-lg font-medium'>
                  {summary.top_income_category?.category_name || 'N/A'}
                </p>
                <p className='text-sm text-green-600'>
                  {formatCurrency(summary.top_income_category?.total || 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4'>
                <p className='text-sm text-muted-foreground'>
                  Día de mayor gasto
                </p>
                <p className='text-lg font-medium'>
                  {summary.top_expense_day?.date || 'N/A'}
                </p>
                <p className='text-sm text-red-600'>
                  {formatCurrency(summary.top_expense_day?.total_expense || 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='p-4'>
                <p className='text-sm text-muted-foreground'>
                  Día de mayor ingreso
                </p>
                <p className='text-lg font-medium'>
                  {summary.top_income_day?.date || 'N/A'}
                </p>
                <p className='text-sm text-green-600'>
                  {formatCurrency(summary.top_income_day?.total_income || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          {summary.overspending_alert && (
            <div className='p-4 rounded-md bg-red-100 text-red-800 text-center font-medium'>
              Alerta: Tus gastos superan tus ingresos en este período.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
