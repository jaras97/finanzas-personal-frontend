'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import TransactionFilters, {
  Filters,
} from '@/components/forms/TransactionFilters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import NewTransactionModal from '@/components/forms/NewTransactionModal';
import EditTransactionModal from '@/components/forms/EditTransactionModal';
import { TransactionWithCategoryRead } from '@/types';
import { reverseTransaction } from '@/utils/reverseTransaction';
import { Pagination } from '@/components/ui/pagination';
import DateTimeDisplay from '@/components/ui/DateTimeDisplay';
import ReverseTransactionDialog from '@/components/forms/ReverseTransactionDialog';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/extractErrorMessage';
import ReversalNoteDialog from '@/components/forms/ReversalNoteDialog';
import { StickyNote, Filter, RotateCw, Search } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

/* Tabla reusable (headless) */
import { DataTable } from '@/components/ui/data-table';
import { buildTransactionColumns } from './columns';

/* Summary por rango (solo fecha) para KPIs */
import { useSummary } from '@/hooks/useSummary';

type Currency = 'COP' | 'USD' | 'EUR';

const SYSTEM_CATEGORY_STYLES: Record<string, string> = {
  Transferencia: 'bg-sky-50 text-sky-700 border-sky-200',
  'Pago de deuda': 'bg-amber-50 text-amber-700 border-amber-200',
  Comisión: 'bg-rose-50 text-rose-700 border-rose-200',
  Interés: 'bg-violet-50 text-violet-700 border-violet-200',
  Ajuste: 'bg-slate-50 text-slate-700 border-slate-200',
};

function categoryBadgeClasses(tx: TransactionWithCategoryRead) {
  const cat = tx.category;
  if (!cat) return '';
  const isSystem =
    (cat as any).is_system === true || (cat as any).origin === 'system';
  if (isSystem) {
    const key = cat.name || '';
    return (
      SYSTEM_CATEGORY_STYLES[key] ??
      'bg-slate-50 text-slate-700 border-slate-200'
    );
  }
  if (tx.type === 'income')
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (tx.type === 'expense') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

/* Helpers fechas */
const dayKey = (d: Date | undefined) =>
  d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() : 0;

function parseMaybeDate(v: unknown): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  if (typeof v === 'string') {
    const d = new Date(v);
    return isNaN(+d) ? undefined : d;
  }
  return undefined;
}

export default function TransactionsPage() {
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);

  const { transactions, loading, refresh, totalPages } = useTransactions(
    filters,
    page,
  );

  const [editTx, setEditTx] = useState<TransactionWithCategoryRead | null>(
    null,
  );
  const [reverseOpen, setReverseOpen] = useState(false);
  const [txToReverse, setTxToReverse] =
    useState<TransactionWithCategoryRead | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteTx, setNoteTx] = useState<TransactionWithCategoryRead | null>(
    null,
  );

  /* ===== helpers visuales ===== */
  const typeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-emerald-600';
      case 'expense':
        return 'text-rose-600';
      case 'transfer':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  const allColumns = useMemo(
    () =>
      buildTransactionColumns({
        onEdit: (tx) => setEditTx(tx),
        onReverse: (tx) => {
          setTxToReverse(tx);
          setReverseOpen(true);
        },
        onShowNote: (tx) => {
          setNoteTx(tx);
          setNoteOpen(true);
        },
      }).map((c, i) => ({
        ...c,
        id: (c as any).id ?? (c as any).accessorKey ?? `col_${i}`,
      })),
    [],
  );

  /* ===== toolbar: búsqueda ===== */
  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter((tx) => {
      const haystack = [
        tx.description,
        tx.category?.name,
        tx.from_account?.name,
        tx.to_account?.name,
        tx.debt?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [transactions, search]);

  /* ====== KPIs por moneda con summary (SOLO cambia con RANGO DE FECHAS) ====== */

  // Rango por defecto (mes actual completo) calculado UNA sola vez
  const defaultDateRange = useMemo(() => {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0), // último día del mes
    };
  }, []);

  // Keys en estado: cuando cambian → se refetch el summary
  const [dateRangeKeys, setDateRangeKeys] = useState(() => ({
    fromKey: dayKey(defaultDateRange.from),
    toKey: dayKey(defaultDateRange.to),
  }));

  // Sync automático: si cambia el rango dentro de "filters" (sin importar cómo lo pase TransactionFilters),
  // recalculamos las keys. Si cambian otros filtros, no se tocan las keys (no hay refetch).
  useEffect(() => {
    const f: any = filters ?? {};
    // soporta dos formas: dateRange:{from,to} O startDate/endDate (string/Date)
    const rawFrom =
      parseMaybeDate(f?.dateRange?.from) ??
      parseMaybeDate(f?.startDate) ??
      defaultDateRange.from;
    const rawTo =
      parseMaybeDate(f?.dateRange?.to) ??
      parseMaybeDate(f?.endDate) ??
      defaultDateRange.to;

    const nextFromKey = dayKey(rawFrom);
    const nextToKey = dayKey(rawTo);

    setDateRangeKeys((prev) =>
      prev.fromKey !== nextFromKey || prev.toKey !== nextToKey
        ? { fromKey: nextFromKey, toKey: nextToKey }
        : prev,
    );
  }, [filters, defaultDateRange.from, defaultDateRange.to]);

  // Construimos DateRange SOLO a partir de las keys en estado (estables)
  const dateRangeForSummary = useMemo(
    () => ({
      from: new Date(dateRangeKeys.fromKey),
      to: new Date(dateRangeKeys.toKey),
    }),
    [dateRangeKeys],
  );

  // Memo del objeto de parámetros para evitar nuevas referencias
  const summaryParams = useMemo(
    () => ({ dateRange: dateRangeForSummary }),
    [dateRangeForSummary],
  );

  // Hook de summary: depende EXCLUSIVAMENTE del rango de fechas (vía state keys)
  const {
    data: summary,
    loading: sumLoading,
    error: sumError,
  } = useSummary(summaryParams);

  // Solo queremos COP y USD si existen en la respuesta
  const currenciesInSummary = useMemo(() => {
    const all = summary ? (Object.keys(summary) as Currency[]) : [];
    return (['COP', 'USD'] as Currency[]).filter((c) => all.includes(c));
  }, [summary]);

  const nf = useMemo(() => new Intl.NumberFormat('es-CO'), []);

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-semibold'>Transacciones</h1>
          <p className='text-sm text-muted-foreground'>
            Historial y gestión de tus movimientos.
          </p>
        </div>
      </div>

      {/* KPIs por moneda basados en SUMMARY del rango (se actualizan al cambiar fechas) */}
      {!sumLoading && summary && (
        <section className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <Card variant='kpi-income' interactive>
            <CardContent className='py-5 px-6'>
              <p className='text-sm text-slate-700'>Ingresos (rango)</p>
              <div className='mt-1 space-y-1.5'>
                {currenciesInSummary.map((cur) => (
                  <div
                    key={`inc-${cur}`}
                    className='flex items-center justify-between'
                  >
                    <span className='text-xs text-slate-600'>{cur}</span>
                    <span className='text-xl font-semibold tracking-tight'>
                      {nf.format(summary[cur]?.total_income ?? 0)} {cur}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card variant='kpi-expense' interactive>
            <CardContent className='py-5 px-6'>
              <p className='text-sm text-slate-700'>Gastos (rango)</p>
              <div className='mt-1 space-y-1.5'>
                {currenciesInSummary.map((cur) => (
                  <div
                    key={`exp-${cur}`}
                    className='flex items-center justify-between'
                  >
                    <span className='text-xs text-slate-600'>{cur}</span>
                    <span className='text-xl font-semibold tracking-tight'>
                      {nf.format(summary[cur]?.total_expense ?? 0)} {cur}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card variant='kpi-balance' interactive>
            <CardContent className='py-5 px-6'>
              <p className='text-sm text-slate-700'>Neto (rango)</p>
              <div className='mt-1 space-y-1.5'>
                {currenciesInSummary.map((cur) => {
                  const inc = summary[cur]?.total_income ?? 0;
                  const exp = summary[cur]?.total_expense ?? 0;
                  const net = inc - exp;
                  return (
                    <div
                      key={`net-${cur}`}
                      className='flex items-center justify-between'
                    >
                      <span className='text-xs text-slate-600'>{cur}</span>
                      <span className='text-xl font-semibold tracking-tight'>
                        {nf.format(net)} {cur}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {sumError && <div className='text-sm text-rose-600'>{sumError}</div>}

      {/* Toolbar (desktop) + Tabla */}
      <Card variant='white' className='hidden md:block'>
        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-4 py-3'>
          <div className='flex items-center gap-2'>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant='outline' className='gap-2'>
                  <Filter className='h-4 w-4' />
                  Filtros
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align='start'
                sideOffset={8}
                className='p-3 w-[min(92vw,720px)]'
              >
                <TransactionFilters
                  onFilterChange={(f) => {
                    setPage(1);
                    setFilters(f);
                  }}
                />
              </PopoverContent>
            </Popover>

            <Button variant='outline' className='gap-2' onClick={refresh}>
              <RotateCw className='h-4 w-4' />
              Actualizar
            </Button>

            <div className='relative'>
              <Input
                className='w-[240px] pl-9'
                placeholder='Buscar…'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Search className='pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60' />
            </div>
          </div>

          <NewTransactionModal onCreated={refresh} />
        </div>

        <CardContent className='p-0'>
          <div className='px-4'>
            <DataTable
              columns={allColumns as any}
              data={filteredData}
              loading={loading}
              density='normal'
              rowSeparator='inset'
              tableClassName='min-w-[960px] xl:min-w-0'
            />
          </div>
        </CardContent>

        {!loading && totalPages > 1 && (
          <div className='border-t px-4 py-3'>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>

      {/* Toolbar MOBILE */}
      <div className='md:hidden px-2 pt-1'>
        <div className='flex flex-wrap items-center gap-2'>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant='outline' size='sm' className='gap-2'>
                <Filter className='h-4 w-4' />
                Filtros
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align='start'
              sideOffset={8}
              className='p-3 w-[min(92vw,720px)]'
            >
              <TransactionFilters
                onFilterChange={(f) => {
                  setPage(1);
                  setFilters(f);
                }}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant='outline'
            size='sm'
            className='shrink-0'
            onClick={refresh}
          >
            <RotateCw className='h-4 w-4' />
            <span className='sr-only'>Actualizar</span>
          </Button>

          <div className='relative flex-1 basis-full'>
            <Input
              className='w-full pl-9 h-9'
              placeholder='Buscar…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className='pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60' />
          </div>

          <div className='ml-auto'>
            <NewTransactionModal onCreated={refresh} />
          </div>
        </div>
      </div>

      {/* Mobile: lista en cards */}
      {!loading && (
        <div className='md:hidden space-y-2'>
          {filteredData.length === 0 ? (
            <Card variant='white'>
              <CardContent className='p-6 text-center text-muted-foreground'>
                No hay transacciones con estos filtros.
              </CardContent>
            </Card>
          ) : (
            filteredData.map((tx) => {
              const isCreditCardPurchase =
                tx.source_type === 'credit_card_purchase';
              const isEditable =
                !tx.is_cancelled &&
                !tx.reversed_transaction_id &&
                !isCreditCardPurchase &&
                !tx.source_type;
              const isReversible =
                !tx.is_cancelled &&
                !tx.reversed_transaction_id &&
                tx.type !== 'transfer';
              const showNoteButton =
                tx.is_cancelled &&
                !!(tx.reversal_note && tx.reversal_note.trim());

              return (
                <Card key={tx.id} variant='white'>
                  <CardContent className='p-4'>
                    <div className='flex items-start justify-between gap-3'>
                      <div>
                        <p
                          className={cn(
                            'font-medium',
                            isCreditCardPurchase
                              ? 'text-fuchsia-600'
                              : typeColor(tx.type),
                          )}
                        >
                          {isCreditCardPurchase ? '💳 ' : ''}
                          {tx.description}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          <DateTimeDisplay isoDate={tx.date} />
                        </p>
                      </div>
                      <p
                        className={cn(
                          'text-right font-semibold',
                          isCreditCardPurchase
                            ? 'text-fuchsia-600'
                            : typeColor(tx.type),
                        )}
                      >
                        {tx.type === 'income' ? '+' : '-'}{' '}
                        {tx.amount.toLocaleString()}{' '}
                        {tx.saving_account?.currency ?? tx.debt?.currency ?? ''}
                      </p>
                    </div>

                    <div className='mt-2 flex flex-wrap gap-1'>
                      {tx.category && (
                        <Badge
                          className={cn('border', categoryBadgeClasses(tx))}
                        >
                          {tx.category.name}
                        </Badge>
                      )}
                      {tx.debt?.name && (
                        <Badge
                          className={cn(
                            'border',
                            tx.debt.kind === 'credit_card'
                              ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200',
                          )}
                        >
                          {tx.debt.kind === 'credit_card'
                            ? `💳 Tarjeta: ${tx.debt.name}`
                            : `Deuda: ${tx.debt.name}`}
                        </Badge>
                      )}
                    </div>

                    <div className='mt-2 text-xs text-muted-foreground space-y-0.5'>
                      {tx.from_account && (
                        <p>
                          De: {tx.from_account.name} ({tx.from_account.currency}
                          )
                        </p>
                      )}
                      {tx.to_account && (
                        <p>
                          Para: {tx.to_account.name} ({tx.to_account.currency})
                        </p>
                      )}
                      {tx.saving_account &&
                        !tx.from_account &&
                        !tx.to_account && (
                          <p>
                            {tx.type === 'income' ? 'A' : 'De'} cuenta:{' '}
                            {tx.saving_account.name} (
                            {tx.saving_account.currency})
                          </p>
                        )}
                    </div>

                    <div className='mt-3 flex gap-2 justify-end'>
                      {isEditable && (
                        <Button
                          size='sm'
                          variant='soft-sky'
                          onClick={() => setEditTx(tx)}
                        >
                          Editar
                        </Button>
                      )}
                      {showNoteButton && (
                        <Button
                          size='sm'
                          variant='soft-amber'
                          onClick={() => {
                            setNoteTx(tx);
                            setNoteOpen(true);
                          }}
                        >
                          <StickyNote className='w-4 h-4 mr-1' />
                          Nota
                        </Button>
                      )}
                      <Button
                        size='sm'
                        variant='soft-rose'
                        onClick={() => {
                          setTxToReverse(tx);
                          setReverseOpen(true);
                        }}
                        disabled={!isReversible}
                      >
                        Reversar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Paginación MOBILE */}
      {!loading && totalPages > 1 && (
        <div className='md:hidden border-t mt-3 pt-3 px-2'>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Modales / Diálogos */}
      {editTx && (
        <EditTransactionModal
          open={!!editTx}
          onOpenChange={(open) => !open && setEditTx(null)}
          transaction={editTx}
          onUpdated={refresh}
        />
      )}

      <ReverseTransactionDialog
        open={reverseOpen}
        onOpenChange={(v) => {
          if (!v) setTxToReverse(null);
          setReverseOpen(v);
        }}
        description={txToReverse?.description}
        onConfirm={async (note) => {
          if (!txToReverse) return;
          try {
            await reverseTransaction(txToReverse.id, note);
            toast.success('Transacción reversada');
            setTxToReverse(null);
            refresh();
          } catch (err) {
            toast.error(extractErrorMessage(err));
          }
        }}
      />

      <ReversalNoteDialog
        open={noteOpen}
        onOpenChange={(v) => {
          if (!v) setNoteTx(null);
          setNoteOpen(v);
        }}
        tx={noteTx}
      />
    </div>
  );
}
