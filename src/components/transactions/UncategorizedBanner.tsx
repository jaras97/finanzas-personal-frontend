'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Inbox, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUncategorizedCount } from '@/hooks/useUncategorizedCount';

/**
 * Aviso de movimientos sin clasificar.
 *
 * Descartable **por sesión**, no para siempre: un aviso que se puede silenciar
 * definitivamente deja de ser un aviso, y uno que no se puede callar se
 * convierte en ruido para quien ya decidió que esos cincuenta movimientos de
 * 2024 no le importan hoy. Vuelve en la siguiente visita, que es cuando la
 * decisión puede ser otra.
 *
 * No se pinta mientras el conteo es `null` (cargando o error): un aviso que
 * aparece medio segundo tarde y empuja la página hacia abajo es peor que uno
 * que llega un poco después.
 */

const CLAVE = 'bc.avisoPendientes.oculto';

export default function UncategorizedBanner({
  className,
}: {
  className?: string;
}) {
  const { count } = useUncategorizedCount();
  const [oculto, setOculto] = useState(true);

  // Se lee después del montaje: `sessionStorage` no existe en el render del
  // servidor y leerlo durante el render desajustaría la hidratación.
  useEffect(() => {
    try {
      setOculto(sessionStorage.getItem(CLAVE) === '1');
    } catch {
      setOculto(false);
    }
  }, []);

  if (oculto || !count) return null;

  const descartar = () => {
    setOculto(true);
    try {
      sessionStorage.setItem(CLAVE, '1');
    } catch {
      /* modo privado: se queda oculto solo en memoria */
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/70',
        'px-4 py-3 text-sm',
        className,
      )}
    >
      <span className='inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700'>
        <Inbox className='h-4 w-4' />
      </span>

      <p className='min-w-0 flex-1 text-amber-900'>
        <strong className='font-semibold tabular-nums'>{count}</strong>{' '}
        {count === 1
          ? 'movimiento está sin clasificar'
          : 'movimientos están sin clasificar'}
        .{' '}
        <span className='text-amber-800/80'>
          Mientras tanto no entran en el desglose por categoría.
        </span>
      </p>

      <Link
        href='/transactions/pendientes'
        className={cn(
          'shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white',
          'transition-colors hover:bg-amber-700',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1',
        )}
      >
        Clasificar
      </Link>

      <button
        type='button'
        onClick={descartar}
        aria-label='Ocultar aviso'
        className='shrink-0 rounded p-1 text-amber-700/70 transition-colors hover:bg-amber-100 hover:text-amber-900'
      >
        <X className='h-4 w-4' />
      </button>
    </div>
  );
}
