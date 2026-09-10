'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { categoryColor } from '@/lib/categoryStyle';
import { categoryIcon } from '@/lib/categoryIcon';
import {
  buildPickerSections,
  categoryDisplayName,
  flattenSections,
} from '@/lib/categoryTree';
import type { Category } from '@/types';
import { Check, ChevronsUpDown, Search } from 'lucide-react';

/**
 * Selector de categoría con búsqueda.
 *
 * Reemplaza al `Select` plano, que era el control equivocado para esta
 * cardinalidad: con la taxonomía completa se recorrían hasta 94 entradas con
 * scroll. Acá se escribe «gas» y aparece «Transporte › Gasolina».
 *
 * Solo ofrece HOJAS: los grupos agrupan pero no reciben movimientos, y
 * ofrecerlos sería ofrecer un error que el backend rechaza al guardar. La
 * cabecera de grupo está ahí como contexto, no como opción.
 *
 * Se descartó el desplegable en dos pasos (grupo → hoja): duplica los toques
 * del caso común, que es no querer bajar de nivel.
 */

type Props = {
  id?: string;
  categories: Category[];
  /** Id de la categoría seleccionada, como string (igual que el Select). */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Si se pasa, ofrece crear una categoría con lo escrito cuando no hay match. */
  onCreate?: (nombre: string) => void;
  /**
   * Disparador propio, para cuando el selector no vive en un formulario.
   * En la lista de movimientos el disparador es el chip de la categoría: un
   * campo de formulario de 36px de alto ahí dentro rompería la fila.
   */
  trigger?: React.ReactNode;
};

export function CategoryPicker({
  id,
  categories,
  value,
  onChange,
  disabled,
  placeholder = 'Seleccionar categoría',
  onCreate,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activo, setActivo] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  const secciones = useMemo(
    () => buildPickerSections(categories, query),
    [categories, query],
  );
  const opciones = useMemo(() => flattenSections(secciones), [secciones]);
  const seleccionada = categories.find((c) => String(c.id) === value);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActivo(0);
    // Enfocar el buscador al abrir: escribir es el camino rápido.
    const t = setTimeout(() => inputRef.current?.focus(), 40);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => setActivo(0), [query]);

  // Mantener a la vista la opción activa al navegar con el teclado.
  useEffect(() => {
    listaRef.current
      ?.querySelector<HTMLElement>('[data-activo="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [activo]);

  const elegir = (c: Category) => {
    onChange(String(c.id));
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (opciones.length === 0) return;
      const paso = e.key === 'ArrowDown' ? 1 : -1;
      setActivo((i) => (i + paso + opciones.length) % opciones.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (opciones[activo]) elegir(opciones[activo]);
      else if (onCreate && query.trim()) {
        onCreate(query.trim());
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  let indice = -1;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ?? (
        <button
          id={id}
          type='button'
          role='combobox'
          aria-expanded={open}
          // `combobox` no toma su nombre del contenido, así que sin esto un
          // lector de pantalla anuncia "cuadro combinado" y nada más.
          aria-label={placeholder}
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 rounded-md border',
            'border-[hsl(var(--border))] bg-white px-3 text-sm',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
        >
          {seleccionada ? (
            <span className='flex items-center gap-2 min-w-0'>
              <span
                className='inline-flex h-5 w-5 items-center justify-center rounded shrink-0'
                style={{
                  background: `${categoryColor(seleccionada)}22`,
                  color: categoryColor(seleccionada),
                }}
                aria-hidden='true'
              >
                {(() => {
                  const I = categoryIcon(seleccionada.icon);
                  return <I className='h-3 w-3' />;
                })()}
              </span>
              <span className='truncate'>
                {categoryDisplayName(seleccionada, categories)}
              </span>
            </span>
          ) : (
            <span className='text-muted-foreground truncate'>{placeholder}</span>
          )}
          <ChevronsUpDown className='h-4 w-4 opacity-50 shrink-0' />
        </button>
        )}
      </PopoverTrigger>

      <PopoverContent
        align='start'
        // z alto: este selector vive dentro de modales, que ya están en z-[110]
        className='z-[140] p-0 w-[--radix-popover-trigger-width] min-w-[260px]'
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className='flex items-center gap-2 border-b border-[hsl(var(--border))] px-3'>
          <Search className='h-4 w-4 opacity-50 shrink-0' />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder='Buscar categoría…'
            aria-label='Buscar categoría'
            className='h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground'
          />
        </div>

        <div ref={listaRef} className='max-h-[46vh] overflow-y-auto py-1'>
          {opciones.length === 0 ? (
            <div className='px-3 py-6 text-center text-sm text-muted-foreground'>
              {query.trim() ? (
                onCreate ? (
                  <button
                    type='button'
                    onClick={() => {
                      onCreate(query.trim());
                      setOpen(false);
                    }}
                    className='text-[hsl(var(--primary))] hover:underline'
                  >
                    Crear «{query.trim()}»
                  </button>
                ) : (
                  <>Ninguna categoría coincide con «{query.trim()}».</>
                )
              ) : (
                <>No hay categorías disponibles.</>
              )}
            </div>
          ) : (
            secciones.map((sec) => (
              <div key={sec.group ? `g-${sec.group.id}` : 'frecuentes'}>
                {/* Un grupo colapsado NO lleva cabecera: su única opción ya
                    lleva el nombre del grupo, y repetirlo arriba sería el
                    mismo texto dos veces, uno pulsable y otro no. */}
                {!sec.collapsed && (
                <p
                  className={cn(
                    'px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide',
                    'text-muted-foreground flex items-center gap-1.5',
                  )}
                >
                  {sec.group && (
                    <span
                      className='inline-block h-2 w-2 rounded-sm'
                      style={{ background: categoryColor(sec.group) }}
                      aria-hidden='true'
                    />
                  )}
                  {sec.label}
                </p>
                )}
                {sec.options.map((c) => {
                  indice += 1;
                  const i = indice;
                  const esActiva = i === activo;
                  const elegida = String(c.id) === value;
                  return (
                    <button
                      key={`${sec.group?.id ?? 'f'}-${c.id}`}
                      type='button'
                      data-activo={esActiva}
                      onMouseEnter={() => setActivo(i)}
                      onClick={() => elegir(c)}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm',
                        // 44px de alto en móvil: es un objetivo táctil, no una fila de tabla
                        'min-h-[44px] sm:min-h-0',
                        esActiva && 'bg-[hsl(var(--muted))]',
                      )}
                    >
                      {sec.collapsed && sec.group && (
                        <span
                          className='inline-block h-2 w-2 shrink-0 rounded-sm'
                          style={{ background: categoryColor(sec.group) }}
                          aria-hidden='true'
                        />
                      )}
                      <span className='flex-1 truncate'>
                        {sec.collapsed && sec.group
                          ? sec.group.name
                          : sec.group
                          ? c.name
                          : categoryDisplayName(c, categories)}
                      </span>
                      {elegida && (
                        <Check className='h-4 w-4 text-[hsl(var(--primary))] shrink-0' />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
