'use client';

import * as React from 'react';
import {
  ColumnDef,
  Row,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type DataTableProps<TData> = {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  loading?: boolean;
  rowSeparator?: 'none' | 'full' | 'inset';

  /** Estilo de densidad */
  density?: 'normal' | 'compact';

  /** Clases opcionales para ajustar estilos desde fuera */
  className?: string; // wrapper
  tableClassName?: string; // <table>
  headerClassName?: string; // <thead>

  /** Custom por fila/click (opcional) */
  rowClassName?: (row: Row<TData>) => string | undefined;
  onRowClick?: (row: Row<TData>) => void;

  /** Mensaje vacío */
  emptyMessage?: React.ReactNode;
};

export function DataTable<TData>({
  columns,
  data,
  loading,
  density = 'normal',
  className,
  tableClassName,
  headerClassName,
  rowClassName,
  onRowClick,
  emptyMessage = 'No hay datos para mostrar.',
  rowSeparator = 'none',
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 0);
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const padCell = density === 'compact' ? 'px-3 py-2' : 'px-4 py-3';

  return (
    <div className={cn('relative', className)}>
      <div
        ref={scrollRef}
        className={cn(
          'overflow-x-auto max-w-full',
          rowSeparator === 'inset' && 'px-4', // inset respecto al card
        )}
      >
        <table
          className={cn(
            'w-full text-sm border-collapse',
            density === 'compact' && '[&_*]:text-[13px]',
            tableClassName,
          )}
        >
          <thead
            className={cn(
              // Encabezado pegado con sombra al hacer scroll
              'sticky top-0 z-10 border-b bg-[hsl(var(--card))]',
              scrolled &&
                'shadow-[0_1px_0_0_rgba(0,0,0,0.02),0_10px_24px_-16px_rgba(2,6,23,.18)]',
              headerClassName,
            )}
          >
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className='text-muted-foreground'>
                {hg.headers.map((header) => {
                  const sortable = header.column.getCanSort();
                  return (
                    <th
                      key={header.id}
                      className={cn('text-left font-medium', padCell)}
                      aria-sort={
                        sortable
                          ? ((header.column.getIsSorted() === 'asc'
                              ? 'ascending'
                              : header.column.getIsSorted() === 'desc'
                              ? 'descending'
                              : 'none') as React.AriaAttributes['aria-sort'])
                          : undefined
                      }
                    >
                      {header.isPlaceholder ? null : sortable ? (
                        <button
                          className='inline-flex items-center gap-1 hover:underline'
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          <ArrowUpDown className='h-3.5 w-3.5 opacity-60' />
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody
            className={cn(
              rowSeparator !== 'none' && 'divide-y divide-border/60', // ← separador gris delgado
            )}
          >
            {loading ? (
              <tr>
                <td
                  className={cn('text-center text-muted-foreground', padCell)}
                  colSpan={columns.length}
                >
                  Cargando…
                </td>
              </tr>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-t transition-colors hover:bg-[hsl(var(--muted))] cursor-default',
                    rowClassName?.(row),
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={cn('align-top', padCell)}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className={cn(
                    'text-center text-muted-foreground',
                    density === 'compact' ? 'py-6' : 'py-10',
                  )}
                  colSpan={columns.length}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
