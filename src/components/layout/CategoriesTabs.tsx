'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/categories', label: 'Categorías' },
  { href: '/budgets', label: 'Presupuestos' },
  { href: '/rules', label: 'Reglas' },
];

/**
 * Igual patrón que TransactionsTabs: Presupuestos y Reglas no tienen su
 * propio ítem en el sidebar, viven como pestañas dentro de Categorías
 * (roadmap Fases 2 y 5).
 */
export default function CategoriesTabs() {
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
