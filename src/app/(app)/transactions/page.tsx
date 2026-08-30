'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useSavingAccounts } from '@/hooks/useSavingAccounts';
import TransactionFilters, {
  Filters,
  defaultTransactionFilters,
} from '@/components/forms/TransactionFilters';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import NewTransactionModal, {
  NewTransactionInitial,
} from '@/components/forms/NewTransactionModal';
import api from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import TransactionsTabs from '@/components/layout/TransactionsTabs';
import EditTransactionModal from '@/components/forms/EditTransactionModal';
import RuleModal from '@/components/forms/RuleModal';
import AttachmentsModal from '@/components/forms/AttachmentsModal';
import TransferBetweenAccountsModal from '@/components/forms/TransferBetweenAccountsModal';
import { currencyType, TransactionWithCategoryRead } from '@/types';
import { reverseTransaction } from '@/utils/reverseTransaction';
import { Pagination } from '@/components/ui/pagination';
import DateTimeDisplay from '@/components/ui/DateTimeDisplay';
import ReverseTransactionDialog from '@/components/forms/ReverseTransactionDialog';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/extractErrorMessage';
import ReversalNoteDialog from '@/components/forms/ReversalNoteDialog';
import {
  StickyNote,
  Filter,
  RotateCw,
  Search,
  Repeat,
  ArrowLeftRight,
} from 'lucide-react';
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
import {
  mergeTransferPairs,
  isTransferLeg,
  transferDisplayDescription,
  transferAmountDisplay,
  getStatusLabel,
  type DisplayTransaction,
} from '@/lib/transactionDisplay';

/* Summary por rango (solo fecha) para KPIs */
import { useSummary } from '@/hooks/useSummary';
import {
  TransactionsDesktopSkeleton,
  TransactionsKpisSkeleton,
  TransactionsMobileSkeleton,
} from '@/components/skeletons/TransactionsSkeleton';

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
  // Mismo default (mes actual) que usan las tarjetas KPI de esta misma
  // pantalla -- antes la tabla arrancaba sin ningún límite de fecha (todo el
  // historial) mientras las KPI ya mostraban "mes actual", una contradicción
  // visible desde el primer render.
  const [filters, setFilters] = useState<Filters>(defaultTransactionFilters);
  const [page, setPage] = useState(1);

  const hasActiveFilters = useMemo(() => {
    const d = defaultTransactionFilters();
    // Comparación por día calendario, no por timestamp exacto: el default
    // recalcula "ahora" en cada llamada, así que comparar el ISO completo
    // (con segundos) siempre daría distinto y marcaría el filtro como
    // "activo" aunque el usuario no haya tocado nada.
    const sameDay =
      dayKey(parseMaybeDate(filters.startDate)) === dayKey(parseMaybeDate(d.startDate)) &&
      dayKey(parseMaybeDate(filters.endDate)) === dayKey(parseMaybeDate(d.endDate));
    return (
      !sameDay ||
      !!filters.type ||
      !!filters.categoryId ||
      (!!filters.source && filters.source !== 'all')
    );
  }, [filters]);

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
  const [attachmentsTx, setAttachmentsTx] =
    useState<TransactionWithCategoryRead | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  // Solo se usa para el modal de transferencia del toolbar.
  const { accounts, refresh: refreshAccounts } = useSavingAccounts();
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [ruleInitial, setRuleInitial] = useState<
    { matchText?: string; categoryId?: number } | undefined
  >(undefined);

  /* ===== Repetir última transacción ===== */
  // Dos instancias de NewTransactionModal (desktop/mobile) comparten los
  // datos a precargar, pero cada una necesita su propia señal de apertura:
  // si compartieran la misma, ambas se abrirían a la vez (cada una en su
  // propio portal), aunque solo una esté visible según el viewport.
  const [repeatInitial, setRepeatInitial] = useState<
    NewTransactionInitial | undefined
  >(undefined);
  const [repeatSignalDesktop, setRepeatSignalDesktop] = useState(0);
  const [repeatSignalMobile, setRepeatSignalMobile] = useState(0);

  const handleRepeatLast = async (which: 'desktop' | 'mobile') => {
    try {
      const { data } = await api.get('/transactions/with-category', {
        params: { source: 'account', page: 1, page_size: 10 },
      });
      const items: TransactionWithCategoryRead[] = data?.items ?? [];
      // Solo movimientos manuales (sin source_type): transferencias, pagos de
      // deuda, compras con tarjeta, etc. no son "repetibles" con este formulario.
      const last = items.find(
        (t) =>
          !t.source_type &&
          !t.is_cancelled &&
          (t.type === 'income' || t.type === 'expense') &&
          !!t.saving_account_id &&
          !!t.category,
      );
      if (!last) {
        toast.error('No hay una transacción reciente para repetir');
        return;
      }
      setRepeatInitial({
        type: last.type as 'income' | 'expense',
        accountId: String(last.saving_account_id),
        categoryId: String(last.category!.id),
        amount: last.amount,
        description: last.description,
      });
      if (which === 'desktop') setRepeatSignalDesktop((s) => s + 1);
      else setRepeatSignalMobile((s) => s + 1);
    } catch {
      toast.error('No se pudo obtener la última transacción');
    }
  };

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
        onCreateRule: (tx) => {
          setRuleInitial({ matchText: tx.description ?? '', categoryId: tx.category?.id });
          setRuleModalOpen(true);
        },
        onAttachments: (tx) => setAttachmentsTx(tx),
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

  // Una transferencia son 2 filas (pata de salida + pata de entrada) en los
  // datos crudos, pero es UN solo movimiento para el usuario -- fusionarlas
  // evita que se lea como "gasté Y también gané" en una lista que por lo
  // demás es puro ingreso/gasto real.
  const displayData = useMemo(
    () => mergeTransferPairs(filteredData),
    [filteredData],
  );

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

  // Todas las monedas que el usuario realmente tiene en este período
  const currenciesInSummary = useMemo(
    () => (summary ? (Object.keys(summary) as currencyType[]) : []),
    [summary],
  );

  const nf = useMemo(() => new Intl.NumberFormat('es-CO'), []);

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Transacciones'
        subtitle='Historial y gestión de tus movimientos.'
      />
      <TransactionsTabs />

      {sumLoading && <TransactionsKpisSkeleton />}

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
      {loading ? (
        <TransactionsDesktopSkeleton />
      ) : (
        <Card variant='white' className='hidden md:block'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-4 py-3'>
            <div className='flex items-center gap-2'>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='outline' className='gap-2 relative'>
                    <Filter className='h-4 w-4' />
                    Filtros
                    {hasActiveFilters && (
                      <span className='absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary' />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align='start'
                  sideOffset={8}
                  className='p-3 w-[min(92vw,720px)]'
                >
                  <TransactionFilters
                    value={filters}
                    onChange={(f) => {
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

            <Button
              variant='outline'
              className='gap-2'
              onClick={() => handleRepeatLast('desktop')}
              disabled={loading}
            >
              <Repeat className='h-4 w-4' />
              Repetir última
            </Button>

            {/* Una transferencia también se registra desde acá, no solo desde
                Cuentas: el usuario que acaba de moverla en su banco viene a
                Transacciones a anotarla, y desde que las patas se fusionan en
                una fila, la lista ya "enseña" que las transferencias viven
                aquí -- faltaba poder crearlas. */}
            <Button
              variant='soft-emerald'
              className='gap-2'
              onClick={() => setTransferOpen(true)}
              disabled={loading}
            >
              <ArrowLeftRight className='h-4 w-4' />
              Transferir
            </Button>

            <NewTransactionModal
              onCreated={refresh}
              disabled={loading}
              initial={repeatInitial}
              openSignal={repeatSignalDesktop}
            />
          </div>

          <CardContent className='p-0'>
            <div className='px-4'>
              <DataTable
                columns={allColumns as any}
                data={displayData}
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
      )}

      {/* Toolbar MOBILE */}
      {!loading && (
        <div className='md:hidden px-2 pt-1'>
          <div className='flex flex-wrap items-center gap-2'>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant='outline' size='sm' className='gap-2 relative'>
                  <Filter className='h-4 w-4' />
                  Filtros
                  {hasActiveFilters && (
                    <span className='absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary' />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align='start'
                sideOffset={8}
                className='p-3 w-[min(92vw,720px)]'
              >
                <TransactionFilters
                  value={filters}
                  onChange={(f) => {
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

            <Button
              variant='outline'
              size='sm'
              className='shrink-0'
              onClick={() => handleRepeatLast('mobile')}
            >
              <Repeat className='h-4 w-4' />
              <span className='sr-only'>Repetir última</span>
            </Button>

            <div className='ml-auto'>
              <NewTransactionModal
                onCreated={refresh}
                disabled={loading}
                initial={repeatInitial}
                openSignal={repeatSignalMobile}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile: lista en cards */}

      {loading ? (
        <TransactionsMobileSkeleton />
      ) : (
        <div className='md:hidden space-y-2'>
          {displayData.length === 0 ? (
            <Card variant='white'>
              <CardContent className='p-6 text-center text-muted-foreground'>
                No hay transacciones con estos filtros.
              </CardContent>
            </Card>
          ) : (
            displayData.map((tx) => {
              const isCreditCardPurchase =
                tx.source_type === 'credit_card_purchase';
              const isTransfer = isTransferLeg(tx);
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
                              : isTransfer
                              ? 'text-primary'
                              : typeColor(tx.type),
                          )}
                        >
                          {isCreditCardPurchase ? '💳 ' : ''}
                          {isTransfer
                            ? transferDisplayDescription(tx)
                            : tx.description}
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
                            : isTransfer
                            ? 'text-primary'
                            : typeColor(tx.type),
                        )}
                      >
                        {tx._pairedWith ? (
                          transferAmountDisplay(tx, tx._pairedWith)
                        ) : (
                          <>
                            {tx.type === 'income' ? '+' : '-'}{' '}
                            {tx.amount.toLocaleString()}{' '}
                            {tx.saving_account?.currency ?? tx.debt?.currency ?? ''}
                          </>
                        )}
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
      <TransferBetweenAccountsModal
        open={transferOpen}
        onOpenChange={setTransferOpen}
        accounts={accounts}
        onTransferred={() => {
          refresh();
          // Los saldos cambiaron: el modal los muestra al elegir cuenta.
          refreshAccounts();
        }}
      />

      <AttachmentsModal
        open={!!attachmentsTx}
        onOpenChange={(o) => !o && setAttachmentsTx(null)}
        transactionId={attachmentsTx?.id ?? null}
        description={
          attachmentsTx && isTransferLeg(attachmentsTx)
            ? transferDisplayDescription(attachmentsTx)
            : attachmentsTx?.description
        }
        onChanged={refresh}
      />

      <RuleModal
        open={ruleModalOpen}
        onOpenChange={(o) => {
          setRuleModalOpen(o);
          if (!o) setRuleInitial(undefined);
        }}
        initial={ruleInitial}
        onSaved={() => {}}
      />

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
        description={
          txToReverse &&
          (isTransferLeg(txToReverse)
            ? transferDisplayDescription(txToReverse)
            : txToReverse.description)
        }
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
