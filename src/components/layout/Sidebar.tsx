'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  List,
  Banknote,
  CreditCard,
  Folder,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/transactions', label: 'Transacciones', icon: List },
  { href: '/saving-accounts', label: 'Cuentas de ahorro', icon: Banknote },
  { href: '/debts', label: 'Deudas', icon: CreditCard },
  { href: '/categories', label: 'Categorías', icon: Folder },
  { href: '/monthly-summaries', label: 'Resumen mensual', icon: Calendar },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className='hidden md:flex flex-col w-56 p-4 border-r min-h-screen bg-white'>
      <nav className='flex flex-col gap-2'>
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center p-2 rounded hover:bg-gray-100 transition',
              pathname === href && 'bg-gray-100 font-semibold',
            )}
          >
            <Icon className='w-5 h-5 mr-2' />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
