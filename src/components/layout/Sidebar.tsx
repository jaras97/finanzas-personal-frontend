'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  List,
  Banknote,
  CreditCard,
  Folder,
  Calendar,
  X,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/lib/store/sidebarStore';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';
import Cookies from 'js-cookie';

const links = [
  { href: '/summary', label: 'Resumen', icon: Calendar },
  { href: '/transactions', label: 'Transacciones', icon: List },
  { href: '/saving-accounts', label: 'Cuentas', icon: Banknote },
  { href: '/debts', label: 'Deudas', icon: CreditCard },
  { href: '/categories', label: 'Categorías', icon: Folder },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle, close } = useSidebarStore();
  const router = useRouter();
  const { clearToken } = useAuthStore();

  const handleLogout = () => {
    clearToken();
    Cookies.remove('access_token');
    router.push('/auth/login');
  };

  const Nav = ({ onItemClick }: { onItemClick?: () => void }) => (
    <nav className='mt-4 flex flex-col gap-1'>
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            onClick={onItemClick}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors',
              'text-[hsl(var(--sidebar-foreground))]/80 hover:text-[hsl(var(--sidebar-foreground))]',
              active
                ? 'bg-white/10 text-[hsl(var(--sidebar-foreground))] ring-1 ring-white/15'
                : 'hover:bg-white/5',
            )}
          >
            <Icon
              className={cn(
                'h-5 w-5',
                active
                  ? 'text-white'
                  : 'text-[hsl(var(--sidebar-foreground))]/90 group-hover:text-white',
              )}
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const Footer = ({ onClose }: { onClose?: () => void }) => (
    <div className='mt-auto pt-4'>
      <Button
        variant='secondary'
        className='w-full justify-start gap-2 bg-white/10 hover:bg-white/15 text-white border-white/20'
        onClick={() => {
          onClose?.();
          handleLogout();
        }}
      >
        <LogOut className='h-4 w-4' />
        Cerrar sesión
      </Button>
      <p className='mt-3 text-xs text-white/50'>v1.0 • Finanzas</p>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <aside className='fixed inset-0 z-50 md:hidden'>
          <div className='absolute inset-0 bg-black/50' onClick={toggle} />
          <div className='relative z-10 h-full w-64 bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] p-4 flex flex-col'>
            <button
              onClick={toggle}
              className='self-end rounded-lg p-1 hover:bg-white/10'
            >
              <X className='h-5 w-5 text-white' />
            </button>
            <div className='mt-1'>
              <p className='text-sm font-semibold tracking-wide text-white/80'>
                MENÚ
              </p>
            </div>

            <div className='flex-1 overflow-y-auto pr-1'>
              <Nav onItemClick={close} />
            </div>

            <Footer onClose={close} />
          </div>
        </aside>
      )}

      {/* Desktop fijo */}
      <aside
        className={cn(
          'hidden md:flex md:fixed md:inset-y-0 md:left-0 md:z-40',
          'w-64 flex-col border-r border-[hsl(var(--sidebar-border))]',
          'bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))]',
        )}
      >
        <div className='h-16 shrink-0 px-4 flex items-center'>
          <div className='flex items-center gap-2'>
            <div className='h-8 w-8 rounded-xl bg-white/10 grid place-items-center text-white font-semibold'>
              ₿
            </div>
            <div className='leading-tight'>
              <p className='text-sm font-semibold text-white'>Finanzas</p>
              <p className='text-[11px] text-white/60'>Personal</p>
            </div>
          </div>
        </div>

        <div className='flex-1 overflow-y-auto px-3 pb-4'>
          <p className='px-2 text-[11px] tracking-widest text-white/40'>MENÚ</p>
          <Nav />
        </div>

        <div className='px-3 pb-4'>
          <Footer />
        </div>
      </aside>
    </>
  );
}
