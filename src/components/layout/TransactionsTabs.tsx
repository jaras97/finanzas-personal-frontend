'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUncategorizedCount } from '@/hooks/useUncategorizedCount';

const tabs = [
  { href: '/transactions', label: 'Movimientos' },
  { href: '/transactions/pendientes', label: 'Sin clasificar' },
  { href: '/recurring', label: 'Recurrentes' },
];

/**
 * Recurrentes ya no tiene su propio ítem en el sidebar -- PENDIENTES.md ya lo
 * enmarcaba como una asistencia a Transacciones ("reducir fricción de
 * captura"), no un dominio aparte. Sigue siendo su propia ruta (nada de su
 * lógica interna cambió); esto solo la presenta como pestaña.
 *
 * "Sin clasificar" lleva el número al lado: sin él la pestaña es una promesa
 * de trabajo pendiente que hay que abrir para saber si existe. Y cuando no
 * queda nada, la pestaña desaparece en vez de quedarse en cero -- un destino
 * que siempre está vacío se vuelve invisible de todos modos.
 */
export default function TransactionsTabs() {
  const pathname = usePathname();
  const { count } = useUncategorizedCount();

  return (
    <div className='inline-flex items-center gap-1 rounded-xl bg-muted p-1'>
      {tabs.map((tab) => {
        const esPendientes = tab.href === '/transactions/pendientes';
        const active = pathname === tab.href;
        if (esPendientes && !count && !active) return null;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            {esPendientes && !!count && (
              <span className='rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold tabular-nums text-amber-800'>
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
