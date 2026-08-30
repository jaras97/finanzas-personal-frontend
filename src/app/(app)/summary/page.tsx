'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSummary } from '@/hooks/useSummary';
import { useAssetsSummary } from '@/hooks/useAssetsSummary';
import { useLiabilitiesSummary } from '@/hooks/useLiabilitiesSummary';
import { useNetWorthSummary } from '@/hooks/useNetWorthSummary';
import { useCashFlowSummary } from '@/hooks/useCashFlowSummary';
import { useBudgets } from '@/hooks/useBudgets';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { PageHeader } from '@/components/ui/page-header';
import { formatDayLabel } from '@/lib/formatDayLabel';
import { CurrencyToggle } from '@/components/ui/CurrencyToggle';
import { AreaIncomeExpense } from '@/components/chart/AreaIncomeExpense';
import { DonutByCategory } from '@/components/chart/DonutByCategory';
import type { FC } from 'react';
import { SummarySkeleton } from '@/components/skeletons/SummarySkeleton';
import { currencyType } from '@/types';
import { progressTone } from '@/lib/budgetDisplay';
import { cn } from '@/lib/utils';

const SummaryPage: FC = () => {
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(today.getFullYear(), today.getMonth(), 1),
    endDate: today,
  });
  const [currency, setCurrency] = useState<currencyType>('COP');

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
  const { items: budgets, loading: lB } = useBudgets();

  const hour = today.getHours();
  const greeting =
    hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  const isBusy = loading || lA || lL || lN || lC;

  // Las monedas disponibles son las que el usuario realmente tiene en uso
  // (las que trae la propia respuesta del backend), no una lista fija.
  const availableCurrencies = useMemo(() => {
    const codes = new Set<currencyType>();
    Object.keys(summary || {}).forEach((c) => codes.add(c));
    Object.keys(assets?.total_assets || {}).forEach((c) => codes.add(c));
    return Array.from(codes).sort();
  }, [summary, assets]);

  useEffect(() => {
    if (availableCurrencies.length > 0 && !availableCurrencies.includes(currency)) {
      setCurrency(
        availableCurrencies.includes('COP') ? 'COP' : availableCurrencies[0],
      );
    }
  }, [availableCurrencies, currency]);

  const s = summary?.[currency];

  // Presupuestos son siempre del mes en curso (no del rango de fechas
  // elegido arriba) y, como el resto de esta pantalla, se leen en la
  // moneda seleccionada -- nunca se fusionan montos entre monedas.
  const currencyBudgets = useMemo(
    () => budgets.filter((b) => b.currency === currency),
    [budgets, currency],
  );
  const overLimitBudgets = useMemo(
    () => currencyBudgets.filter((b) => b.percentage >= 100),
    [currencyBudgets],
  );

  return (
    <div className='space-y-6' aria-busy={isBusy}>
      <PageHeader
        title={`${greeting} 👋`}
        subtitle='Aquí tienes tu resumen financiero.'
        actions={
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
              onChange={(c) => setCurrency(c)}
              options={availableCurrencies}
              disabled={isBusy}
            />
          </div>
        </div>
        }
      />

      {/* Estado de error */}
      {error && (
        <div className='flex items-center text-red-600 gap-2'>
          <AlertCircle className='w-5 h-5' />
          <p>{error}</p>
        </div>
      )}

      {/* === LOADING: Skeletons === */}
      {isBusy && !error && <SummarySkeleton />}

      {/* === CONTENT === */}
      {/* 1) Hero: las 2 cifras que de verdad importan de un vistazo */}
      {!isBusy && s && assets && liabilities && netWorth && (
        <section className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          {[
            {
              label: 'Patrimonio neto',
              value: formatCurrency(netWorth[currency]?.net_worth || 0, currency),
              variant:
                (netWorth[currency]?.net_worth || 0) >= 0
                  ? ('kpi-income' as const)
                  : ('kpi-expense' as const),
            },
            {
              label: 'Balance del período',
              value: formatCurrency(s.balance, currency),
              variant: 'kpi-balance' as const,
            },
          ].map(({ label, value, variant }) => (
            <Card key={label} variant={variant} interactive>
              <CardContent className='py-6 px-7'>
                <p className='text-sm text-slate-700'>{label}</p>
                <p className='mt-1 text-3xl font-semibold tracking-tight'>
                  {value}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {/* 2) Secundarios: mismo dato, menor peso visual -- no compiten con el hero */}
      {!isBusy && s && assets && liabilities && cashFlow && (
        <section className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
          {[
            {
              l: 'Ingresos',
              v: s.total_income,
              tone: 'text-emerald-700' as const,
            },
            {
              l: 'Gastos',
              v: s.total_expense,
              tone: 'text-rose-700' as const,
            },
            {
              l: 'Total en cuentas',
              v: assets.total_assets[currency] || 0,
              tone: 'text-emerald-700' as const,
              href: '/saving-accounts',
            },
            {
              l: 'Total deudas',
              v: liabilities.total_liabilities[currency] || 0,
              tone: 'text-rose-700' as const,
              href: '/debts',
            },
            {
              l: 'Ingresos de caja',
              v: cashFlow[currency]?.total_income || 0,
              tone: 'text-emerald-700' as const,
            },
            {
              l: 'Egresos de caja',
              v: cashFlow[currency]?.total_expense || 0,
              tone: 'text-rose-700' as const,
            },
            {
              l: 'Pagos de deudas',
              v: cashFlow[currency]?.total_debt_payments || 0,
              tone: 'text-amber-700' as const,
            },
            {
              l: 'Flujo neto',
              v: cashFlow[currency]?.net_cash_flow || 0,
              tone:
                (cashFlow[currency]?.net_cash_flow || 0) >= 0
                  ? ('text-emerald-700' as const)
                  : ('text-rose-700' as const),
            },
          ].map(({ l, v, tone, href }) => {
            const card = (
              <Card variant='surface' interactive={!!href}>
                <CardContent className='p-4'>
                  <p className='text-xs text-muted-foreground'>{l}</p>
                  <p className={`mt-0.5 text-base font-semibold ${tone}`}>
                    {formatCurrency(v, currency)}
                  </p>
                </CardContent>
              </Card>
            );
            return href ? (
              <Link key={l} href={href} className='block'>
                {card}
              </Link>
            ) : (
              <div key={l}>{card}</div>
            );
          })}
        </section>
      )}

      {/* 3) Presupuestos del mes -- solo si el usuario tiene alguno en esta moneda */}
      {!isBusy && !lB && currencyBudgets.length > 0 && (
        <section className='space-y-3'>
          {overLimitBudgets.length > 0 && (
            <div className='p-4 rounded-xl bg-rose-50 text-rose-700 text-center font-medium'>
              {overLimitBudgets.length === 1
                ? `Superaste el presupuesto de ${overLimitBudgets[0].category_name} este mes (${currency}).`
                : `Superaste el presupuesto de ${overLimitBudgets.length} categorías este mes (${currency}): ${overLimitBudgets
                    .map((b) => b.category_name)
                    .join(', ')}.`}
            </div>
          )}

          <Card variant='surface'>
            <CardContent className='p-4 space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-sm font-medium text-muted-foreground'>
                  Presupuestos del mes ({currency})
                </h3>
                <Link
                  href='/budgets'
                  className='text-xs font-medium text-sky-700 hover:underline'
                >
                  Ver todos
                </Link>
              </div>

              <div className='space-y-3'>
                {currencyBudgets.map((b) => {
                  const tone = progressTone(b.percentage);
                  const widthPct = Math.min(b.percentage, 100);
                  return (
                    <div key={b.id} className='space-y-1.5'>
                      <div className='flex items-center justify-between gap-2 text-sm'>
                        <div className='flex items-center gap-2 min-w-0'>
                          <span className='font-medium truncate'>
                            {b.category_name}
                          </span>
                          <Badge variant='outline' className={cn('w-fit', tone.badge)}>
                            {b.percentage.toFixed(0)}%
                          </Badge>
                        </div>
                        <span className='text-muted-foreground tabular-nums shrink-0'>
                          {formatCurrency(b.spent, b.currency)} de{' '}
                          {formatCurrency(b.amount, b.currency)}
                        </span>
                      </div>
                      <div className='h-1.5 w-full rounded-full bg-muted overflow-hidden'>
                        <div
                          className={cn('h-full rounded-full transition-all', tone.bar)}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
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
};

export default SummaryPage;
