'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CalendarRange, FileSpreadsheet, FilterX, Receipt } from 'lucide-react';

/**
 * El vacío de la lista de movimientos.
 *
 * Son **dos** vacíos que se ven igual y piden cosas opuestas: quien acaba de
 * registrarse no tiene nada que limpiar, y quien tiene tres años de historial
 * no necesita que le expliquen qué es una transacción. Ofrecer la salida
 * equivocada deja al usuario buscando un botón que no le sirve.
 *
 * Vive en su propio archivo porque lo usan los DOS árboles de la lista (la
 * tabla de escritorio y las cards de móvil). Duplicarlo era garantizar que se
 * arreglara solo en uno.
 */

type Props = {
  /** `null` mientras no se sabe: no se pinta nada todavía. */
  hasAnyTransaction: boolean | null;
  /** Si hay filtros distintos de los de por defecto. */
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  /** Amplía el rango para abarcar todo el historial. */
  onShowAll: () => void;
};

export default function TransactionsEmpty({
  hasAnyTransaction,
  hasActiveFilters,
  onClearFilters,
  onShowAll,
}: Props) {
  if (hasAnyTransaction === null) return null;

  // --- Cuenta nueva: no hay nada que filtrar -------------------------------
  if (!hasAnyTransaction) {
    return (
      <div className='px-6 py-12 text-center'>
        <span className='mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-muted-foreground'>
          <Receipt className='h-6 w-6' />
        </span>
        <p className='font-medium'>Todavía no hay movimientos</p>
        <p className='mx-auto mt-1 max-w-md text-sm text-muted-foreground'>
          Registra un gasto o un ingreso y aquí verás tu historial. También
          puedes traer el extracto de tu banco y clasificarlo de una vez.
        </p>
        <div className='mt-4 flex flex-wrap items-center justify-center gap-2'>
          <Button variant='soft-sky' size='sm' asChild>
            <Link href='/saving-accounts'>Importar un extracto</Link>
          </Button>
        </div>
        <p className='mt-3 text-xs text-muted-foreground'>
          O usa el botón <strong>+ Nueva transacción</strong> de arriba.
        </p>
      </div>
    );
  }

  // --- Hay historial, pero no en esta ventana ------------------------------
  return (
    <div className='px-6 py-12 text-center'>
      <span className='mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--muted))] text-muted-foreground'>
        <FileSpreadsheet className='h-6 w-6' />
      </span>
      <p className='font-medium'>Ningún movimiento en este período</p>
      <p className='mx-auto mt-1 max-w-md text-sm text-muted-foreground'>
        {hasActiveFilters
          ? 'Sí tienes movimientos registrados, pero ninguno coincide con los filtros activos.'
          : 'La lista arranca en el mes en curso. Amplía el rango de fechas para ver tu historial.'}
      </p>
      {/* La acción tiene que HACER algo. Cuando no hay filtros que limpiar,
          un botón «volver al rango por defecto» ya estando en él sería un
          botón muerto: lo que falta ahí es ensanchar la ventana. */}
      <div className='mt-4 flex justify-center'>
        {hasActiveFilters ? (
          <Button variant='outline' size='sm' className='gap-2' onClick={onClearFilters}>
            <FilterX className='h-4 w-4' />
            Limpiar filtros
          </Button>
        ) : (
          <Button variant='outline' size='sm' className='gap-2' onClick={onShowAll}>
            <CalendarRange className='h-4 w-4' />
            Ver todo el historial
          </Button>
        )}
      </div>
    </div>
  );
}
