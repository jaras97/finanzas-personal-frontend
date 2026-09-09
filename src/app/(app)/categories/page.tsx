// app/(tu-ruta)/categories/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
import CategoryModal from '@/components/forms/CategoryModal';
import axios, { AxiosError } from 'axios';
import { Category, currencyType } from '@/types';
import ConfirmCategoryStatusModal from '@/components/forms/ConfirmCategoryStatusModal';
import CategoriesTabs from '@/components/layout/CategoriesTabs';
import { Sparkles } from 'lucide-react';
import { categoryColor } from '@/lib/categoryStyle';
import { categoryIcon } from '@/lib/categoryIcon';
import { categoryRows } from '@/lib/categoryTree';
import CategoryTaxonomyModal from '@/components/forms/CategoryTaxonomyModal';

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

  const [taxonomyOpen, setTaxonomyOpen] = useState(false);
  // Grupo al que se le va a añadir una subcategoría desde la lista.
  const [desglosando, setDesglosando] = useState<number | null>(null);
  // Se muestra una sola vez por navegador: es una invitación, no un peaje.
  // El usuario nuevo ya llega con las 13 del núcleo sembradas y puede
  // registrar un gasto sin pasar por acá.
  const [invitacionVista, setInvitacionVista] = useState(true);
  useEffect(() => {
    try {
      setInvitacionVista(localStorage.getItem('bc-taxonomia-vista') === '1');
    } catch {
      // Modo privado: se asume vista para no insistir en cada carga.
      setInvitacionVista(true);
    }
  }, []);
  const ocultarInvitacion = () => {
    setInvitacionVista(true);
    try {
      localStorage.setItem('bc-taxonomia-vista', '1');
    } catch {
      /* la invitación simplemente vuelve a salir; no es un error */
    }
  };

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
  // La lista NO muestra el árbol crudo: un grupo con una sola hoja se pinta
  // como una línea, porque «Mascotas › General» no le dice nada a nadie.
  const filasActivas = useMemo(() => categoryRows(active), [active]);
  const inactive = useMemo(
    () => categories.filter((c) => !c.is_active),
    [categories],
  );

  return (
    <div className='space-y-6'>
      <PageHeader
        title='Categorías'
        subtitle='Organiza tus ingresos y gastos por categoría.'
        actions={
          loading || sLoading ? (
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
              <div className='flex gap-2 flex-wrap'>
                <Button
                  onClick={() => setTaxonomyOpen(true)}
                  variant='soft-slate'
                  title='Elige qué categorías recomendadas quieres usar. Nada se guarda hasta que confirmes.'
                >
                  <Sparkles className='h-4 w-4 mr-1' />
                  Configurar categorías
                </Button>
                <Button onClick={() => setModalOpen(true)} variant='soft-sky'>
                  + Nueva categoría
                </Button>
              </div>
            </div>
          )
        }
      />
      <CategoriesTabs />

      {!invitacionVista && !loading && (
        <Card variant='white' className='p-4 flex flex-col sm:flex-row sm:items-center gap-3'>
          <div className='flex-1 min-w-0'>
            <p className='font-medium text-sm'>Ajusta tus categorías a tu forma de gastar</p>
            <p className='text-xs text-muted-foreground mt-0.5'>
              Empezaste con las más comunes. Puedes añadir otras, quitar las que
              no uses y abrir subcategorías como «Transporte › Gasolina».
            </p>
          </div>
          <div className='flex gap-2 shrink-0'>
            <Button variant='soft-slate' size='sm' onClick={ocultarInvitacion}>
              Ahora no
            </Button>
            <Button
              variant='soft-emerald'
              size='sm'
              onClick={() => {
                ocultarInvitacion();
                setTaxonomyOpen(true);
              }}
            >
              Configurar
            </Button>
          </div>
        </Card>
      )}

      <CategoryTaxonomyModal
        open={taxonomyOpen}
        onOpenChange={setTaxonomyOpen}
        onApplied={fetchCategories}
      />

      {/* KPIs: top gasto / top ingreso, en cualquier moneda que el usuario use */}
      {sLoading ? (
        <CategoriesKpisSkeleton />
      ) : (
        <section className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <TopCategoryByCurrencyCard
            title='Top categoría de gasto'
            data={topExpense}
            cardVariant='kpi-expense'
            prefer={['COP', 'USD']}
          />
          <TopCategoryByCurrencyCard
            title='Top categoría de ingreso'
            data={topIncome}
            cardVariant='kpi-income'
            prefer={['COP', 'USD']}
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
        ) : filasActivas.length ? (
          <div className='space-y-2'>
            {filasActivas.map((fila) => {
              // `collapsed` = grupo de una hoja: se manipula el GRUPO, que es
              // lo que el usuario cree que está tocando.
              const objetivo = fila.kind === 'leaf' ? fila.leaf : fila.group;
              const esHoja = fila.kind === 'leaf';
              const Icono = categoryIcon(fila.group.icon);
              const tono = categoryColor(fila.group);
              return (
                <Card
                  key={`${fila.kind}-${objetivo.id}`}
                  className={cn(
                    'p-4 flex flex-col md:flex-row md:justify-between md:items-center',
                    esHoja && 'md:ml-8 ml-4 border-l-2 border-l-slate-200',
                  )}
                  variant='white'
                >
                  <div>
                    <p className='font-medium flex items-center gap-2 flex-wrap'>
                      {!esHoja && (
                        <span
                          className='inline-flex h-6 w-6 items-center justify-center rounded-md shrink-0'
                          style={{ background: `${tono}22`, color: tono }}
                          aria-hidden='true'
                        >
                          <Icono className='h-3.5 w-3.5' />
                        </span>
                      )}
                      {objetivo.name}
                      {fila.kind === 'group' && (
                        <span className='text-xs font-normal text-muted-foreground'>
                          {fila.leafCount}{' '}
                          {fila.leafCount === 1 ? 'subcategoría' : 'subcategorías'}
                        </span>
                      )}
                    </p>
                    <div className='flex gap-2 mt-1 flex-wrap'>
                      <Badge
                        variant='outline'
                        className={cn('capitalize w-fit', typeBadgeTone[objetivo.type])}
                      >
                        {objetivo.type === 'income'
                          ? 'Ingreso'
                          : objetivo.type === 'expense'
                          ? 'Egreso'
                          : 'Ambos'}
                      </Badge>
                      {objetivo.is_system && (
                        <Badge variant='secondary' className='w-fit'>
                          Sistema
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className='mt-2 md:mt-0 flex gap-2 flex-wrap'>
                    {fila.kind !== 'leaf' && !objetivo.is_system && (
                      <Button
                        size='sm'
                        variant='soft-sky'
                        onClick={() => setDesglosando(fila.group.id)}
                        title={`Añadir una subcategoría dentro de ${fila.group.name}`}
                      >
                        + Subcategoría
                      </Button>
                    )}
                    <Button
                      size='sm'
                      variant='soft-slate'
                      disabled={processingId === objetivo.id || objetivo.is_system}
                      onClick={() => {
                        if (!objetivo.is_system) setEditCategory(objetivo);
                      }}
                      title={
                        objetivo.is_system
                          ? 'Categoría del sistema: No puedes editarla'
                          : 'Editar categoría'
                      }
                    >
                      Editar
                    </Button>
                    <Button
                      size='sm'
                      variant='destructive'
                      disabled={processingId === objetivo.id || objetivo.is_system}
                      onClick={() => {
                        if (objetivo.is_system) return;
                        setConfirm({ action: 'deactivate', category: objetivo });
                      }}
                    >
                      {processingId === objetivo.id ? 'Procesando…' : 'Desactivar'}
                    </Button>
                  </div>
                </Card>
              );
            })}
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
      {desglosando !== null && (
        <CategoryModal
          open={desglosando !== null}
          onOpenChange={(open) => !open && setDesglosando(null)}
          defaultParentId={desglosando}
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
