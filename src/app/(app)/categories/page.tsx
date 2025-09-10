// app/(tu-ruta)/categories/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
import CategoryModal from '@/components/forms/CategoryModal';
import axios, { AxiosError } from 'axios';
import { Category, currencyType } from '@/types';
import ConfirmCategoryStatusModal from '@/components/forms/ConfirmCategoryStatusModal';

import { useSummary } from '@/hooks/useSummary';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import TopCategoryByCurrencyCard, {
  type TopByCurrency,
} from '@/components/kpi/TopCategoryByCurrencyCard';
import { cn } from '@/lib/utils';
import {
  CategoriesHeaderSkeleton,
  CategoriesKpisSkeleton,
  CategoriesListSkeleton,
} from '@/components/skeletons/CategoriesSkeleton';

/* ====== tonos para badges por tipo ====== */
const typeBadgeTone: Record<Category['type'], string> = {
  income:
    'border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-200 dark:bg-emerald-950/30',
  expense:
    'border-rose-300 text-rose-700 bg-rose-50 dark:border-rose-800 dark:text-rose-200 dark:bg-rose-950/30',
  both: 'border-sky-300 text-sky-700 bg-sky-50 dark:border-sky-800 dark:text-sky-200 dark:bg-sky-950/30',
};

/* ====== helpers ====== */
function extractApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{
      detail?: unknown;
      message?: unknown;
      error?: unknown;
      errors?: unknown;
    }>;
    const data = ax.response?.data;
    const detail = (data?.detail ??
      data?.message ??
      data?.error ??
      data?.errors) as unknown;

    if (typeof detail === 'string') return detail;

    if (Array.isArray(detail)) {
      const msgs = (detail as Array<{ msg?: string }>).map((e) => e?.msg);
      const filtered = msgs.filter(Boolean) as string[];
      if (filtered.length) return filtered.join(' • ');
    }

    try {
      return JSON.stringify(detail ?? data ?? err);
    } catch {
      return ax.message || 'Error inesperado';
    }
  }
  return 'Error inesperado';
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  // Backend actions
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{
    action: 'deactivate' | 'reactivate';
    category: Category;
  } | null>(null);

  // ====== filtros para KPIs (por defecto: mes actual)
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(today.getFullYear(), today.getMonth(), 1),
    endDate: today,
  });
  const filters = useMemo(
    () => ({
      dateRange: { from: dateRange.startDate, to: dateRange.endDate },
      type: 'all' as const,
    }),
    [dateRange],
  );
  const { data: summary, loading: sLoading } = useSummary(filters);

  // ====== cargar categorías
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Category[]>('/categories?status=all');
      setCategories(data);
    } catch {
      toast.error('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCategories();
  }, []);

  const performStatusChange = async (
    action: 'deactivate' | 'reactivate',
    category: Category,
  ) => {
    setProcessingId(category.id);
    try {
      if (action === 'deactivate') {
        await api.delete(`/categories/${category.id}`);
        toast.success('Categoría desactivada correctamente');
      } else {
        await api.put(`/categories/${category.id}/reactivate`);
        toast.success('Categoría reactivada correctamente');
      }
      await fetchCategories();
    } catch (error) {
      toast.error(
        extractApiError(error) ||
          (action === 'deactivate'
            ? 'Error al desactivar categoría'
            : 'Error al reactivar categoría'),
      );
    } finally {
      setProcessingId(null);
      setConfirm(null);
    }
  };

  /* ====== Top categoría por moneda (gasto / ingreso), SOLO COP y USD ====== */
  const topExpense: TopByCurrency = useMemo(() => {
    const out = {} as TopByCurrency;
    if (summary) {
      for (const [cur, s] of Object.entries(summary)) {
        const c = cur as currencyType;
        const list =
          (s?.expense_by_category as Array<{
            category_name: string;
            total: number;
          }>) || [];
        const top =
          list.reduce(
            (acc, i) => (i.total > (acc?.total ?? -Infinity) ? i : acc),
            undefined as { category_name: string; total: number } | undefined,
          ) ?? undefined;
        out[c] = top
          ? { name: top.category_name, total: top.total }
          : undefined;
      }
    }
    return out;
  }, [summary]);

  const topIncome: TopByCurrency = useMemo(() => {
    const out = {} as TopByCurrency;
    if (summary) {
      for (const [cur, s] of Object.entries(summary)) {
        const c = cur as currencyType;
        const list =
          (s?.income_by_category as Array<{
            category_name: string;
            total: number;
          }>) || [];
        const top =
          list.reduce(
            (acc, i) => (i.total > (acc?.total ?? -Infinity) ? i : acc),
            undefined as { category_name: string; total: number } | undefined,
          ) ?? undefined;
        out[c] = top
          ? { name: top.category_name, total: top.total }
          : undefined;
      }
    }
    return out;
  }, [summary]);

  // ====== agrupaciones UI
  const active = useMemo(
    () => categories.filter((c) => c.is_active),
    [categories],
  );
  const inactive = useMemo(
    () => categories.filter((c) => !c.is_active),
    [categories],
  );

  return (
    <div className='space-y-6'>
      {/* Header + filtros */}
      <div className='flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between'>
        <div className='min-w-0'>
          <h1 className='text-2xl font-semibold'>Categorías</h1>
          <p className='text-sm text-muted-foreground'>
            Organiza tus ingresos y gastos por categoría.
          </p>
        </div>
        {loading || sLoading ? (
          <CategoriesHeaderSkeleton />
        ) : (
          <div className='flex flex-col sm:flex-row gap-3 sm:items-center w-full md:w-auto'>
            <div className='w-full sm:w-[min(420px,100%)]'>
              <DateRangePicker
                value={{
                  startDate: dateRange.startDate,
                  endDate: dateRange.endDate,
                }}
                onChange={setDateRange}
                disabled={sLoading}
              />
            </div>
            <div className='flex gap-2'>
              <Button onClick={() => setModalOpen(true)} variant='soft-sky'>
                + Nueva categoría
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* KPIs: SOLO top gasto / top ingreso, y SOLO COP & USD */}
      {sLoading ? (
        <CategoriesKpisSkeleton />
      ) : (
        <section className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <TopCategoryByCurrencyCard
            title='Top categoría de gasto'
            data={topExpense}
            cardVariant='kpi-expense'
            prefer={['COP', 'USD']}
            only={['COP', 'USD']}
          />
          <TopCategoryByCurrencyCard
            title='Top categoría de ingreso'
            data={topIncome}
            cardVariant='kpi-income'
            prefer={['COP', 'USD']}
            only={['COP', 'USD']}
          />
        </section>
      )}

      {/* Activas */}
      <section className='space-y-3'>
        <header className='flex items-center justify-between'>
          <div>
            <h2 className='text-sm font-medium text-muted-foreground'>
              Categorías activas
            </h2>
            <p className='text-xs text-muted-foreground/80'>
              {active.length} activas · {inactive.length} inactivas
            </p>
          </div>
        </header>

        {loading ? (
          <CategoriesListSkeleton items={6} />
        ) : active.length ? (
          <div className='space-y-2'>
            {active.map((cat) => (
              <Card
                key={cat.id}
                className='p-4 flex flex-col md:flex-row md:justify-between md:items-center'
                variant='white'
              >
                <div>
                  <p className='font-medium'>{cat.name}</p>
                  <div className='flex gap-2 mt-1'>
                    <Badge
                      variant='outline'
                      className={cn(
                        'capitalize w-fit',
                        typeBadgeTone[cat.type],
                      )}
                    >
                      {cat.type === 'income'
                        ? 'Ingreso'
                        : cat.type === 'expense'
                        ? 'Egreso'
                        : 'Ambos'}
                    </Badge>
                    <Badge variant='default' className='w-fit'>
                      Activa
                    </Badge>
                    {cat.is_system && (
                      <Badge variant='secondary' className='w-fit'>
                        Sistema
                      </Badge>
                    )}
                  </div>
                </div>

                <div className='mt-2 md:mt-0 flex gap-2 flex-wrap'>
                  <Button
                    size='sm'
                    variant='soft-slate'
                    disabled={processingId === cat.id || cat.is_system}
                    onClick={() => {
                      if (!cat.is_system) setEditCategory(cat);
                    }}
                    title={
                      cat.is_system
                        ? 'Categoría del sistema: No puedes editarla'
                        : 'Editar categoría'
                    }
                  >
                    Editar
                  </Button>
                  <Button
                    size='sm'
                    variant='destructive'
                    disabled={processingId === cat.id || cat.is_system}
                    onClick={() => {
                      if (cat.is_system) return;
                      setConfirm({ action: 'deactivate', category: cat });
                    }}
                  >
                    {processingId === cat.id ? 'Procesando…' : 'Desactivar'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className='text-center p-4 text-muted-foreground'>
            No hay categorías activas.
          </p>
        )}
      </section>

      {/* Inactivas */}
      <section className='space-y-3'>
        <header className='flex items-center justify-between'>
          <div>
            <h2 className='text-sm font-medium text-muted-foreground'>
              Categorías inactivas
            </h2>
            <p className='text-xs text-muted-foreground/80'>
              Manténlas para historial o reactívalas cuando las necesites.
            </p>
          </div>
        </header>

        {loading ? (
          <CategoriesListSkeleton inactive items={4} />
        ) : inactive.length ? (
          <div className='space-y-2'>
            {inactive.map((cat) => (
              <Card
                key={cat.id}
                className='p-4 flex flex-col md:flex-row md:justify-between md:items-center border-dashed'
                variant='white'
              >
                <div>
                  <p className='font-medium line-through text-muted-foreground'>
                    {cat.name}
                  </p>
                  <div className='flex gap-2 mt-1'>
                    <Badge
                      variant='outline'
                      className={cn(
                        'capitalize w-fit',
                        typeBadgeTone[cat.type],
                      )}
                    >
                      {cat.type === 'income'
                        ? 'Ingreso'
                        : cat.type === 'expense'
                        ? 'Egreso'
                        : 'Ambos'}
                    </Badge>
                    <Badge variant='secondary' className='w-fit'>
                      Inactiva
                    </Badge>
                    {cat.is_system && (
                      <Badge variant='secondary' className='w-fit'>
                        Sistema
                      </Badge>
                    )}
                  </div>
                </div>

                <div className='mt-2 md:mt-0 flex gap-2 flex-wrap'>
                  <Button
                    size='sm'
                    variant='soft-slate'
                    disabled={processingId === cat.id || cat.is_system}
                    onClick={() => {
                      if (!cat.is_system) setEditCategory(cat);
                    }}
                    title={
                      cat.is_system
                        ? 'Categoría del sistema: No puedes editarla'
                        : 'Editar categoría'
                    }
                  >
                    Editar
                  </Button>
                  <Button
                    size='sm'
                    variant='soft-emerald'
                    disabled={processingId === cat.id || cat.is_system}
                    onClick={() => {
                      if (cat.is_system) return;
                      setConfirm({ action: 'reactivate', category: cat });
                    }}
                  >
                    {processingId === cat.id ? 'Procesando…' : 'Reactivar'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className='text-center p-4 text-muted-foreground'>
            No hay categorías inactivas.
          </p>
        )}
      </section>

      {/* Modales CRUD */}
      {modalOpen && (
        <CategoryModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onCreated={fetchCategories}
        />
      )}
      {editCategory && (
        <CategoryModal
          open={!!editCategory}
          onOpenChange={(open) => !open && setEditCategory(null)}
          category={editCategory}
          onCreated={fetchCategories}
        />
      )}

      {/* Modal confirmación activar/desactivar */}
      {confirm && (
        <ConfirmCategoryStatusModal
          open={!!confirm}
          onOpenChange={(o) => {
            if (!o && processingId === null) setConfirm(null);
          }}
          category={confirm.category}
          action={confirm.action}
          processing={processingId === confirm.category.id}
          onConfirm={() =>
            performStatusChange(confirm.action, confirm.category)
          }
        />
      )}
    </div>
  );
}
