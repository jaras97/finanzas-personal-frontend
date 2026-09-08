'use client';

import { useEffect, useMemo, useState } from 'react';
import { FormModal } from '@/components/ui/form-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { categoryColor } from '@/lib/categoryStyle';
import { categoryIcon } from '@/lib/categoryIcon';
import {
  computeDiff, hasChanges, initialSelection, selectWithParent,
} from '@/lib/taxonomyDiff';
import type { TaxonomyBlock, TaxonomyItem, TaxonomyApplyResult } from '@/types';
import { ChevronRight, Lock, Search } from 'lucide-react';

/**
 * Selector de categorías recomendadas.
 *
 * Reemplaza al botón que creaba doce categorías de un clic sin avisar. Acá el
 * árbol llega precargado con lo que el usuario ya tiene, él marca y desmarca,
 * y el pie muestra el efecto exacto. **Nada se escribe hasta pulsar Aplicar**,
 * así que la confirmación no es un diálogo aparte: es la pantalla misma.
 *
 * Dos decisiones para que 94 casillas no se conviertan en el muro que la
 * jerarquía venía a evitar: los padres llegan colapsados con el número de
 * subcategorías como pista, y marcar un padre NO marca sus hijas.
 */
export default function CategoryTaxonomyModal({
  open,
  onOpenChange,
  onApplied,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onApplied: () => void;
}) {
  const [blocks, setBlocks] = useState<TaxonomyBlock[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCargando(true);
    setBusqueda('');
    api
      .get<{ blocks: TaxonomyBlock[] }>('/categories/taxonomy')
      .then(({ data }) => {
        setBlocks(data.blocks);
        setSelected(initialSelection(data.blocks));
        setAbiertos(new Set());
      })
      .catch(() => toast.error('No se pudo cargar el catálogo de categorías.'))
      .finally(() => setCargando(false));
  }, [open]);

  const diff = useMemo(() => computeDiff(blocks, selected), [blocks, selected]);
  const hayCambios = hasChanges(diff);

  // Al buscar se muestran también las hijas que coincidan, y su padre se
  // despliega solo: si no, el resultado quedaría escondido tras un colapso.
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return blocks;
    return blocks
      .map((b) => ({
        ...b,
        items: b.items
          .map((i) => {
            const hijasCoinciden = i.children.filter((c) =>
              c.name.toLowerCase().includes(q),
            );
            if (i.name.toLowerCase().includes(q)) return i;
            if (hijasCoinciden.length) return { ...i, children: hijasCoinciden };
            return null;
          })
          .filter(Boolean) as TaxonomyItem[],
      }))
      .filter((b) => b.items.length > 0);
  }, [blocks, busqueda]);

  // Al buscar, los padres cuyas hijas coinciden se despliegan solos: si no, el
  // resultado quedaría escondido tras un colapso y la búsqueda parecería rota.
  const hayBusqueda = busqueda.trim().length > 0;
  const estaDesplegado = (key: string) => hayBusqueda || abiertos.has(key);

  const alternar = (item: TaxonomyItem, marcar: boolean) => {
    if (item.locked && !marcar) return;
    setSelected((s) => selectWithParent(blocks, s, item.key, marcar));
  };

  const aplicar = async () => {
    if (!hayCambios || guardando) return;
    setGuardando(true);
    try {
      const { data } = await api.put<TaxonomyApplyResult>('/categories/taxonomy', {
        selected: [...selected],
      });
      const partes = [
        data.created && `${data.created} creada${data.created === 1 ? '' : 's'}`,
        data.reactivated && `${data.reactivated} reactivada${data.reactivated === 1 ? '' : 's'}`,
        data.deactivated && `${data.deactivated} quitada${data.deactivated === 1 ? '' : 's'}`,
      ].filter(Boolean);
      toast.success(partes.length ? `Listo: ${partes.join(', ')}.` : 'Sin cambios.');
      // Lo omitido se avisa aparte y con más tiempo: es lo que el usuario pidió
      // y no ocurrió, así que enterarse importa más que la confirmación.
      data.skipped.forEach((s) => toast.warning(`No se pudo quitar — ${s}`, { duration: 8000 }));
      onApplied();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error?.response?.data?.detail || 'No se pudieron aplicar los cambios.'
          : 'No se pudieron aplicar los cambios.',
      );
    } finally {
      setGuardando(false);
    }
  };

  const Fila = ({ item, hija }: { item: TaxonomyItem; hija?: boolean }) => {
    const marcada = selected.has(item.key);
    const Icono = categoryIcon(item.icon);
    const desplegado = estaDesplegado(item.key);
    const bloqueada = item.locked && marcada;

    return (
      <div>
        <div
          className={cn(
            'flex items-start gap-2.5 rounded-md px-2 py-2 hover:bg-slate-50',
            hija && 'ml-7 border-l-2 border-l-slate-100 pl-3',
          )}
        >
          <input
            type='checkbox'
            id={`tax-${item.key}`}
            checked={marcada}
            disabled={guardando || bloqueada}
            onChange={(e) => alternar(item, e.target.checked)}
            className='mt-1 h-4 w-4 accent-emerald-600 disabled:opacity-40'
          />
          <label htmlFor={`tax-${item.key}`} className='flex-1 min-w-0 cursor-pointer'>
            <span className='flex items-center gap-2 flex-wrap'>
              {!hija && (
                <span
                  className='inline-flex h-5 w-5 items-center justify-center rounded shrink-0'
                  style={{
                    background: `${categoryColor({ name: item.name, color: item.color })}22`,
                    color: categoryColor({ name: item.name, color: item.color }),
                  }}
                  aria-hidden='true'
                >
                  <Icono className='h-3 w-3' />
                </span>
              )}
              <span className='text-sm font-medium'>{item.name}</span>
              {item.state === 'inactive' && (
                <span className='text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5'>
                  desactivada
                </span>
              )}
              {bloqueada && (
                <span className='inline-flex items-center gap-1 text-[11px] text-slate-500'>
                  <Lock className='h-3 w-3' /> {item.transactions} mov.
                </span>
              )}
            </span>
            {bloqueada && item.locked_reason && (
              <span className='block text-[11px] text-muted-foreground mt-0.5'>
                {item.locked_reason}
              </span>
            )}
          </label>

          {!hija && item.children.length > 0 && (
            <button
              type='button'
              onClick={() =>
                setAbiertos((s) => {
                  const n = new Set(s);
                  n.has(item.key) ? n.delete(item.key) : n.add(item.key);
                  return n;
                })
              }
              className='inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground shrink-0 h-7 px-1.5 rounded'
              aria-expanded={desplegado}
              aria-label={`${desplegado ? 'Ocultar' : 'Ver'} las ${item.children.length} subcategorías de ${item.name}`}
            >
              {item.children.filter((c) => selected.has(c.key)).length || item.children.length}
              <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', desplegado && 'rotate-90')} />
            </button>
          )}
        </div>

        {!hija && desplegado &&
          item.children.map((c) => <Fila key={c.key} item={c} hija />)}
      </div>
    );
  };

  return (
    <FormModal
      open={open}
      onOpenChange={(o) => !guardando && onOpenChange(o)}
      title='Configurar categorías'
      size='xl'
      className='w-[min(100vw-1rem,680px)]'
      footer={
        <div className='flex flex-col sm:flex-row sm:items-center gap-2 w-full'>
          <p className='text-xs text-muted-foreground flex-1' aria-live='polite'>
            {hayCambios ? (
              <>
                {diff.create.length > 0 && <>Crear <b>{diff.create.length}</b> · </>}
                {diff.reactivate.length > 0 && <>Reactivar <b>{diff.reactivate.length}</b> · </>}
                {diff.deactivate.length > 0 && <>Quitar <b>{diff.deactivate.length}</b> · </>}
                Sin cambios <b>{diff.unchanged}</b>
              </>
            ) : (
              <>Sin cambios pendientes · {diff.unchanged} categorías activas</>
            )}
          </p>
          <div className='flex gap-2'>
            <Button
              variant='soft-slate'
              onClick={() => onOpenChange(false)}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button variant='soft-emerald' onClick={aplicar} disabled={!hayCambios || guardando}>
              {guardando ? 'Aplicando…' : 'Aplicar cambios'}
            </Button>
          </div>
        </div>
      }
    >
      <div className='space-y-3'>
        <p className='text-sm text-muted-foreground'>
          Marca las que quieras usar. Nada se guarda hasta que pulses «Aplicar
          cambios», y las que ya tienen movimientos no se pueden quitar.
        </p>

        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60' />
          <Input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder='Buscar categoría…'
            className='pl-9 bg-white'
            aria-label='Buscar en el catálogo de categorías'
            disabled={cargando}
          />
        </div>

        {cargando ? (
          <div className='space-y-2'>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className='h-9 w-full' />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <p className='text-sm text-muted-foreground py-6 text-center'>
            Ninguna categoría coincide con «{busqueda}».
          </p>
        ) : (
          <div className='max-h-[52vh] overflow-y-auto pr-1 space-y-4'>
            {filtrados.map((b) => (
              <section key={b.id}>
                <h3 className='text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 pb-1 border-b border-slate-100'>
                  {b.label}
                </h3>
                {b.items.map((i) => (
                  <Fila key={i.key} item={i} />
                ))}
              </section>
            ))}
          </div>
        )}
      </div>
    </FormModal>
  );
}
