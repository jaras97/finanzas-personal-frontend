'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/transactions', label: 'Movimientos' },
  { href: '/recurring', label: 'Recurrentes' },
];

/**
 * Recurrentes ya no tiene su propio ítem en el sidebar -- PENDIENTES.md ya lo
 * enmarcaba como una asistencia a Transacciones ("reducir fricción de
 * captura"), no un dominio aparte. Sigue siendo su propia ruta (nada de su
 * lógica interna cambió); esto solo la presenta como pestaña.
 */
export default function TransactionsTabs() {
  const pathname = usePathname();

  return (
    <div className='inline-flex items-center gap-1 rounded-xl bg-muted p-1'>
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
