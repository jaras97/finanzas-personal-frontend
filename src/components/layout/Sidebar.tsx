'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  List,
  Banknote,
  CreditCard,
  Folder,
  X,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/lib/store/sidebarStore';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/transactions', label: 'Transacciones', icon: List },
  { href: '/saving-accounts', label: 'Cuentas de ahorro', icon: Banknote },
  { href: '/debts', label: 'Deudas', icon: CreditCard },
  { href: '/categories', label: 'Categorías', icon: Folder },
  { href: '/summary', label: 'Resumen mensual', icon: Calendar },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle, close } = useSidebarStore();

  return (
    <>
      {/* Sidebar en mobile */}
      {isOpen && (
        <aside className='fixed inset-y-0 left-0 z-50 w-56 bg-background border-r border-border flex flex-col p-4 md:hidden'>
          <button onClick={toggle} className='self-end mb-2'>
            <X className='w-6 h-6' />
          </button>
          <nav className='flex flex-col gap-2'>
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={close}
                className={cn(
                  'flex items-center p-2 rounded hover:bg-muted transition',
                  pathname === href && 'bg-muted font-semibold',
                )}
              >
                <Icon className='w-5 h-5 mr-2' />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
      )}

      {/* Sidebar en desktop */}
      <aside className='hidden md:flex flex-col w-56 p-4 border-r border-border bg-background min-h-screen'>
        <nav className='flex flex-col gap-2'>
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center p-2 rounded hover:bg-muted transition',
                pathname === href && 'bg-muted font-semibold',
              )}
            >
              <Icon className='w-5 h-5 mr-2' />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
