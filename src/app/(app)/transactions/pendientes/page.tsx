'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { CheckCheck, Inbox, Loader2, Sparkles } from 'lucide-react';

import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { extractErrorMessage } from '@/lib/extractErrorMessage';
import { categoryDisplayName } from '@/lib/categoryTree';
import { notificarCambioDeDatos } from '@/lib/dataRefresh';
import { useCategories } from '@/hooks/useCategories';
import { PageHeader } from '@/components/ui/page-header';
import TransactionsTabs from '@/components/layout/TransactionsTabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Pagination } from '@/components/ui/pagination';
import DateTimeDisplay from '@/components/ui/DateTimeDisplay';
import { CategoryPicker } from '@/components/forms/CategoryPicker';
import { getTxCurrency } from '@/lib/transactionDisplay';
import type { TransactionWithCategoryRead } from '@/types';

/**
 * Bandeja de clasificación.
 *
 * Una sola pantalla para vaciar lo que quedó sin categoría, con el selector en
 * la propia fila. Lo que se evita es el camino de antes: filtrar la lista a
 * mano, abrir el modal de edición completo de cada movimiento, guardar, volver.
 *
 * Dos decisiones que se notan al usarla:
 *
 *  - **La fila se va sola al clasificarla**, con una confirmación breve antes
 *    de desaparecer. Sin ese medio segundo, treinta movimientos se convierten
 *    en treinta parpadeos y se pierde la cuenta de qué se acaba de hacer.
 *  - **La operación masiva no es todo-o-nada.** Si de veinte seleccionados uno
 *    no admite la categoría (un ingreso hacia una categoría de gasto), se
 *    aplican los diecinueve y se dice cuál quedó fuera.
 */

const POR_PAGINA = 50;
/** Lo que dura la confirmación en verde antes de que la fila se retire. */
const MS_CONFIRMACION = 900;

export default function PendientesPage() {
  const { categories } = useCategories();

  const [items, setItems] = useState<TransactionWithCategoryRead[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [cargando, setCargando] = useState(true);

  const [seleccion, setSeleccion] = useState<Set<number>>(new Set());
  const [categoriaMasiva, setCategoriaMasiva] = useState('');
  const [aplicando, setAplicando] = useState(false);
  /** id -> nombre de la categoría asignada, mientras se muestra el «listo». */
  const [resueltos, setResueltos] = useState<Record<number, string>>({});

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get('/transactions/with-category', {
        params: { uncategorized: true, page, page_size: POR_PAGINA },
      });
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setCargando(false);
    }
  }, [page]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Al vaciar la última página hay que retroceder, o el usuario se queda
  // mirando una página vacía con paginación que dice que hay más.
  useEffect(() => {
    if (!cargando && items.length === 0 && page > 1) setPage((p) => p - 1);
  }, [cargando, items.length, page]);

  const visibles = useMemo(
    () => items.filter((t) => !(t.id in resueltos)),
    [items, resueltos],
  );

  const todosMarcados =
    visibles.length > 0 && visibles.every((t) => seleccion.has(t.id));

  const alternar = (id: number, marcado: boolean) => {
    setSeleccion((prev) => {
      const s = new Set(prev);
      if (marcado) s.add(id);
      else s.delete(id);
      return s;
    });
  };

  const alternarTodos = (marcado: boolean) => {
    setSeleccion(marcado ? new Set(visibles.map((t) => t.id)) : new Set());
  };

  /** Retira la fila del listado tras enseñar la confirmación. */
  const retirar = (ids: number[], nombre: string) => {
    setResueltos((prev) => {
      const next = { ...prev };
      ids.forEach((id) => (next[id] = nombre));
      return next;
    });
    setSeleccion((prev) => {
      const s = new Set(prev);
      ids.forEach((id) => s.delete(id));
      return s;
    });
    setTotal((t) => Math.max(0, t - ids.length));
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => !ids.includes(t.id)));
      setResueltos((prev) => {
        const next = { ...prev };
        ids.forEach((id) => delete next[id]);
        return next;
      });
      // Los saldos no cambian, pero el Resumen y el aviso de pendientes sí.
      notificarCambioDeDatos();
    }, MS_CONFIRMACION);
  };

  const clasificarUna = async (tx: TransactionWithCategoryRead, valor: string) => {
    const id = parseInt(valor, 10);
    if (!id) return;
    const elegida = categories.find((c) => c.id === id);
    const nombre = elegida ? categoryDisplayName(elegida, categories) : 'la categoría';
    try {
      await api.patch(`/transactions/${tx.id}`, { category_id: id });
      retirar([tx.id], nombre);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const aplicarMasiva = async () => {
    const ids = [...seleccion];
    const catId = parseInt(categoriaMasiva, 10);
    if (!ids.length || !catId) return;
    const elegida = categories.find((c) => c.id === catId);
    const nombre = elegida ? categoryDisplayName(elegida, categories) : 'la categoría';

    setAplicando(true);
    try {
      const { data } = await api.patch('/transactions/bulk-category', {
        transaction_ids: ids,
        category_id: catId,
      });
      const omitidos: number[] = (data.skipped ?? []).map(
        (s: { id: number }) => s.id,
      );
      const aplicados = ids.filter((id) => !omitidos.includes(id));

      if (aplicados.length) retirar(aplicados, nombre);
      toast.success(
        `${data.updated} ${data.updated === 1 ? 'movimiento' : 'movimientos'} en «${nombre}»`,
      );
      if (omitidos.length) {
        // El motivo del primero, no un genérico: «no se pudieron actualizar 3»
        // deja al usuario sin saber qué hacer al respecto.
        const primero = data.skipped[0];
        toast.warning(
          omitidos.length === 1
            ? primero.reason
            : `${omitidos.length} quedaron fuera. El primero: ${primero.reason}`,
        );
      }
      setCategoriaMasiva('');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setAplicando(false);
    }
  };

  const vacio = !cargando && visibles.length === 0 && page === 1;

  return (
    <div className='space-y-6 pb-28'>
      <PageHeader
        title='Sin clasificar'
        subtitle='Movimientos que todavía no entran en el desglose por categoría.'
      />
      <TransactionsTabs />

      {vacio ? (
        <Card variant='white'>
          <CardContent className='flex flex-col items-center gap-3 py-16 text-center'>
            <span className='inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600'>
              <CheckCheck className='h-6 w-6' />
            </span>
            <div>
              <p className='font-medium'>No queda nada por clasificar</p>
              <p className='mt-1 text-sm text-muted-foreground'>
                Todos tus movimientos tienen categoría, así que el Resumen
                cuadra con lo que de verdad gastaste.
              </p>
            </div>
            <Button variant='outline' asChild>
              <Link href='/summary'>Ver el desglose</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card variant='white'>
          <div className='flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3'>
            <label className='flex cursor-pointer items-center gap-2 text-sm'>
              <Checkbox
                checked={todosMarcados}
                onCheckedChange={alternarTodos}
                disabled={cargando || visibles.length === 0}
                aria-label='Seleccionar todos los de esta página'
              />
              <span className='text-muted-foreground'>
                {seleccion.size > 0
                  ? `${seleccion.size} seleccionado${seleccion.size === 1 ? '' : 's'}`
                  : 'Seleccionar todos'}
              </span>
            </label>
            <p className='flex items-center gap-1.5 text-sm text-muted-foreground'>
              <Inbox className='h-4 w-4' />
              <strong className='font-semibold tabular-nums text-foreground'>
                {total}
              </strong>
              pendiente{total === 1 ? '' : 's'}
            </p>
          </div>

          <CardContent className='p-0'>
            {cargando ? (
              <div className='flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground'>
                <Loader2 className='h-4 w-4 animate-spin' /> Cargando…
              </div>
            ) : (
              <ul className='divide-y'>
                {items.map((tx) => {
                  const resuelto = resueltos[tx.id];
                  return (
                    <li
                      key={tx.id}
                      className={cn(
                        'overflow-hidden transition-all duration-500',
                        resuelto
                          ? 'max-h-24 bg-emerald-50/70 opacity-0'
                          : 'max-h-40 opacity-100',
                      )}
                    >
                      <div className='flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap'>
                        <Checkbox
                          checked={seleccion.has(tx.id)}
                          onCheckedChange={(v) => alternar(tx.id, v)}
                          disabled={!!resuelto}
                          aria-label={`Seleccionar ${tx.description || 'movimiento'}`}
                        />

                        <div className='min-w-0 flex-1'>
                          <p className='truncate font-medium'>
                            {tx.description || 'Sin descripción'}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            <DateTimeDisplay isoDate={tx.date} />
                            {tx.saving_account && ` · ${tx.saving_account.name}`}
                          </p>
                        </div>

                        <p
                          className={cn(
                            'shrink-0 text-right font-semibold tabular-nums',
                            tx.type === 'income'
                              ? 'text-emerald-600'
                              : 'text-rose-600',
                          )}
                        >
                          {tx.type === 'income' ? '+' : '−'}{' '}
                          {tx.amount.toLocaleString()} {getTxCurrency(tx)}
                        </p>

                        <div className='w-full shrink-0 sm:w-[260px]'>
                          {resuelto ? (
                            <p className='flex items-center justify-end gap-1.5 text-sm font-medium text-emerald-700'>
                              <Sparkles className='h-4 w-4' /> {resuelto}
                            </p>
                          ) : (
                            <CategoryPicker
                              categories={categories}
                              value=''
                              onChange={(v) => clasificarUna(tx, v)}
                              placeholder='Elegir categoría'
                            />
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>

          {!cargando && totalPages > 1 && (
            <div className='border-t px-4 py-3'>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={(p) => {
                  setSeleccion(new Set());
                  setPage(p);
                }}
              />
            </div>
          )}
        </Card>
      )}

      {/* Barra de acción masiva: aparece al seleccionar y no tapa el contenido
          porque la página reserva espacio abajo (pb-28). */}
      {seleccion.size > 0 && (
        <div className='fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur'>
          <div className='mx-auto flex max-w-4xl flex-wrap items-center gap-3'>
            <p className='text-sm font-medium'>
              {seleccion.size} seleccionado{seleccion.size === 1 ? '' : 's'}
            </p>
            <div className='min-w-[220px] flex-1'>
              <CategoryPicker
                categories={categories}
                value={categoriaMasiva}
                onChange={setCategoriaMasiva}
                placeholder='Asignar a…'
              />
            </div>
            <Button
              onClick={aplicarMasiva}
              disabled={!categoriaMasiva || aplicando}
              className='gap-2'
            >
              {aplicando && <Loader2 className='h-4 w-4 animate-spin' />}
              Asignar
            </Button>
            <Button variant='outline' onClick={() => setSeleccion(new Set())}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
