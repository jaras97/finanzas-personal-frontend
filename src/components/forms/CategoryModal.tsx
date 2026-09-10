'use client';

import { useState, useEffect } from 'react';
import { DialogClose } from '@/components/ui/dialog';
import { FormModal } from '@/components/ui/form-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';
import InfoHint from '@/components/ui/info-hint';
import { PALETTE_KEYS, categoryColor, type PaletteKey } from '@/lib/categoryStyle';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';
import { ICON_NAMES, categoryIcon } from '@/lib/categoryIcon';
import { possibleParents, HOJA_SINTETICA } from '@/lib/categoryTree';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  // Antes era un tipo inline con solo id/name/type, así que cada campo nuevo
  // (color, icono, padre) quedaba invisible para el modal. Se usa `Category`
  // completo para que eso no vuelva a pasar.
  category?: Category;
  /** Al crear, deja el grupo preseleccionado. Lo usa el botón «Desglosar»
   *  de la lista: el usuario ya dijo de qué categoría quiere una subcategoría. */
  defaultParentId?: number | null;
};

export default function CategoryModal({
  open,
  onOpenChange,
  onCreated,
  category,
  defaultParentId,
}: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense' | 'both' | ''>('');
  // null = "sin color": el gráfico deriva uno estable del nombre, así que
  // nunca queda una categoría gris ni con color saltarín.
  const [color, setColor] = useState<PaletteKey | null>(null);
  const [icon, setIcon] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string>('');
  // Cómo se llamarán los movimientos que ya estaban sin desglosar.
  const [nombreSueltos, setNombreSueltos] = useState('Otros');
  // Se piden todas (incluidas inactivas) porque el padre podría estar
  // desactivado y hay que seguir mostrándolo como el padre actual.
  const [todas, setTodas] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // IDs accesibles
  const idName = 'cat-name';
  const idType = 'cat-type';

  useEffect(() => {
    if (category) {
      setName(category.name);
      setType(category.type);
      setColor(
        PALETTE_KEYS.includes(category.color as PaletteKey)
          ? (category.color as PaletteKey)
          : null,
      );
      setIcon(category.icon ?? null);
      setParentId(category.parent_id ? String(category.parent_id) : '');
    } else {
      setName('');
      setType('');
      setColor(null);
      setIcon(null);
      setParentId(defaultParentId ? String(defaultParentId) : '');
      setNombreSueltos('Otros');
    }
  }, [category, defaultParentId]);

  useEffect(() => {
    if (!open) return;
    api
      .get<Category[]>('/categories?status=all')
      .then(({ data }) => setTodas(data))
      // Silencioso: sin la lista solo se pierde el selector de padre, el resto
      // del formulario sigue funcionando.
      .catch(() => setTodas([]));
  }, [open]);

  // Manejo de errores (evita pasar objetos al toast)
  const extractApiError = (err: unknown) => {
    if (axios.isAxiosError(err)) {
      const data: any = err.response?.data;
      const detail =
        data?.detail ?? data?.message ?? data?.error ?? data?.errors;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        const msgs = detail.map((e: any) => e?.msg).filter(Boolean);
        if (msgs.length) return msgs.join(' • ');
      }
      try {
        return JSON.stringify(detail ?? data ?? err);
      } catch {
        return err.message || 'Error inesperado';
      }
    }
    return 'Error inesperado';
  };

  // Grupo bajo el que se está creando (si lo hay) y su hoja sintética.
  const grupoElegido = todas.find((c) => String(c.id) === parentId);
  const hojaSintetica = grupoElegido
    ? todas.find(
        (c) =>
          c.parent_id === grupoElegido.id &&
          c.is_active &&
          c.name === HOJA_SINTETICA,
      )
    : undefined;
  // Solo hay algo que reubicar si esa hoja tiene movimientos. Si no, se
  // borrará sola al crear la primera subcategoría de verdad.
  const movimientosSueltos =
    !category && hojaSintetica ? hojaSintetica.transactions_count ?? 0 : 0;

  const handleSubmit = async () => {
    if (loading) return;

    // Al crear una subcategoría el tipo lo manda el grupo: el backend rechaza
    // cualquier otro, así que ofrecerlo sería ofrecer un error. Se resuelve
    // ANTES de validar: con el selector oculto, `type` queda vacío y la
    // guarda cortaba el envío sin decir por qué.
    const tipoFinal = grupoElegido && !category ? grupoElegido.type : type;

    if (!name.trim() || !tipoFinal) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    try {

      if (category) {
        await api.put(`/categories/${category.id}`, {
          name: name.trim(),
          type,
          color,
          icon,
          parent_id: parentId ? Number(parentId) : null,
        });
        toast.success('Categoría actualizada correctamente');
      } else {
        const { data: creada } = await api.post('/categories', {
          name: name.trim(),
          type: tipoFinal,
          color,
          icon,
          parent_id: parentId ? Number(parentId) : null,
        });
        if (movimientosSueltos > 0 && hojaSintetica) {
          // Los movimientos que ya estaban sin desglosar necesitan un nombre
          // propio: dejarlos como «General» expone un detalle interno que el
          // usuario no debería ver nunca.
          await api.put(`/categories/${hojaSintetica.id}`, {
            name: nombreSueltos.trim() || 'Otros',
            type: hojaSintetica.type,
            color: hojaSintetica.color ?? null,
            icon: hojaSintetica.icon ?? null,
            parent_id: hojaSintetica.parent_id,
          });
        }
        toast.success(
          movimientosSueltos > 0
            ? `Subcategoría creada. Tus ${movimientosSueltos} movimientos anteriores quedaron en «${nombreSueltos.trim() || 'Otros'}».`
            : 'Categoría creada correctamente',
        );
      }
      onCreated();
      onOpenChange(false);
    } catch (error) {
      toast.error(extractApiError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      open={open}
      onOpenChange={(o) => !loading && onOpenChange(o)}
      size='md'
      className='w-[min(100vw-1rem,520px)]'
      title={
        category
          ? 'Editar categoría'
          : grupoElegido
          ? `Nueva subcategoría de «${grupoElegido.name}»`
          : 'Nueva categoría'
      }
      footer={
        <>
          <DialogClose asChild>
            <Button
              className='bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 sm:min-w-[140px]'
              disabled={loading}
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            aria-disabled={loading}
            className='sm:min-w-[160px]'
          >
            {loading
              ? category
                ? 'Actualizando…'
                : 'Creando…'
              : category
              ? 'Actualizar'
              : 'Crear'}
          </Button>
        </>
      }
    >
      <div className='space-y-4' aria-busy={loading}>
            {/* Nombre */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idName} className='text-sm font-medium'>
                  Nombre
                </label>
                <InfoHint side='top'>
                  Usa un nombre corto y claro (ej. “Salario”, “Alimentación”).
                </InfoHint>
              </div>
              <Input
                id={idName}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                className='bg-white'
              />
            </div>

            {/* Tipo */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idType} className='text-sm font-medium'>
                  Tipo
                </label>
                <InfoHint side='top'>
                  Si la categoría tiene transacciones, el backend puede impedir
                  cambiar el tipo.
                </InfoHint>
              </div>
              {grupoElegido && !category ? (
                // Heredado: el backend rechaza cualquier otro tipo, así que
                // ofrecer la elección sería ofrecer un error.
                <div className='h-9 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600'>
                  {grupoElegido.type === 'income'
                    ? 'Ingreso'
                    : grupoElegido.type === 'expense'
                    ? 'Egreso'
                    : 'Ambos'}
                  <span className='text-xs text-muted-foreground'>
                    · lo hereda de «{grupoElegido.name}»
                  </span>
                </div>
              ) : (
              <Select
                value={type}
                onValueChange={(v) =>
                  setType(v as 'income' | 'expense' | 'both')
                }
                disabled={loading}
              >
                <SelectTrigger id={idType} className='bg-white'>
                  <SelectValue placeholder='Seleccionar tipo' />
                </SelectTrigger>
                <SelectContent className='select-solid z-[140]'>
                  <SelectItem value='income'>Ingreso</SelectItem>
                  <SelectItem value='expense'>Egreso</SelectItem>
                  <SelectItem value='both'>Ambos</SelectItem>
                </SelectContent>
              </Select>
              )}
            </div>

            {/* Categoría padre */}
            {!category?.is_system && (
              <div className='space-y-1'>
                <div className='flex items-center gap-2'>
                  <label htmlFor='cat-parent' className='text-sm font-medium'>
                    Categoría padre
                  </label>
                  <InfoHint side='top'>
                    Opcional. Una subcategoría suma a su padre en el resumen y en
                    los presupuestos, así que el dashboard sigue mostrando pocas
                    categorías reconocibles. Solo hay dos niveles.
                  </InfoHint>
                </div>
                <select
                  id='cat-parent'
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  disabled={loading || !type}
                  className='h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm disabled:opacity-50'
                >
                  <option value=''>Ninguna (categoría principal)</option>
                  {possibleParents(todas, type, category?.id).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {!type && (
                  <p className='text-xs text-muted-foreground'>
                    Elige primero el tipo para ver los padres compatibles.
                  </p>
                )}
              </div>
            )}

            {movimientosSueltos > 0 && (
              <div className='space-y-1 rounded-lg border border-amber-200 bg-amber-50/60 p-3'>
                <label htmlFor='cat-sueltos' className='text-sm font-medium'>
                  ¿Cómo llamas a lo que ya tenías?
                </label>
                <p className='text-xs text-muted-foreground'>
                  «{grupoElegido?.name}» tiene {movimientosSueltos}{' '}
                  {movimientosSueltos === 1 ? 'movimiento' : 'movimientos'} sin
                  desglosar. Al crear esta subcategoría necesitan un nombre propio.
                </p>
                <Input
                  id='cat-sueltos'
                  value={nombreSueltos}
                  onChange={(e) => setNombreSueltos(e.target.value)}
                  disabled={loading}
                  className='bg-white'
                  placeholder='Otros'
                />
              </div>
            )}

            {/* Color */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium'>Color</span>
                <InfoHint side='top'>
                  Es el color con el que aparece en los gráficos. Si no eliges
                  ninguno, se le asigna uno fijo a partir del nombre.
                </InfoHint>
              </div>
              <div className='flex flex-wrap gap-1.5' role='group' aria-label='Color de la categoría'>
                <button
                  type='button'
                  onClick={() => setColor(null)}
                  disabled={loading}
                  aria-pressed={color === null}
                  title='Automático, a partir del nombre'
                  className={cn(
                    'h-8 px-2.5 rounded-md border text-xs',
                    color === null
                      ? 'border-slate-800 bg-slate-100 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                  )}
                >
                  Automático
                </button>
                {PALETTE_KEYS.map((k) => (
                  <button
                    key={k}
                    type='button'
                    onClick={() => setColor(k)}
                    disabled={loading}
                    aria-pressed={color === k}
                    aria-label={`Color ${k}`}
                    className={cn(
                      'h-8 w-8 rounded-md border-2 transition-transform',
                      color === k ? 'border-slate-800 scale-105' : 'border-transparent',
                    )}
                    style={{ background: categoryColor({ name: '', color: k }) }}
                  />
                ))}
              </div>
            </div>

            {/* Icono */}
            <div className='space-y-1'>
              <span className='text-sm font-medium'>Icono</span>
              <div className='flex flex-wrap gap-1.5' role='group' aria-label='Icono de la categoría'>
                <button
                  type='button'
                  onClick={() => setIcon(null)}
                  disabled={loading}
                  aria-pressed={icon === null}
                  aria-label='Sin icono'
                  className={cn(
                    'inline-flex h-8 w-8 items-center justify-center rounded-md border',
                    icon === null
                      ? 'border-slate-800 bg-slate-100 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50',
                  )}
                >
                  {(() => { const I = categoryIcon(null); return <I className='h-4 w-4' />; })()}
                </button>
                {ICON_NAMES.map((n) => {
                  const I = categoryIcon(n);
                  const activo = icon === n;
                  return (
                    <button
                      key={n}
                      type='button'
                      onClick={() => setIcon(n)}
                      disabled={loading}
                      aria-pressed={activo}
                      aria-label={`Icono ${n}`}
                      className={cn(
                        'inline-flex h-8 w-8 items-center justify-center rounded-md border',
                        activo
                          ? 'border-slate-800 bg-slate-100 text-slate-900'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                      )}
                    >
                      <I className='h-4 w-4' />
                    </button>
                  );
                })}
              </div>
            </div>

            <p className='text-xs text-muted-foreground'>
              ⚠️ Nota: No puedes cambiar el tipo si ya existen transacciones
              asociadas a esta categoría.
            </p>
      </div>
    </FormModal>
  );
}
