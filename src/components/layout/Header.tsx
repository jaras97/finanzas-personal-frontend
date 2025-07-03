'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';
import { LogOut, Menu } from 'lucide-react';
import Cookies from 'js-cookie';
import { useSidebarStore } from '@/lib/store/sidebarStore';

export default function Header() {
  const { clearToken } = useAuthStore();
  const router = useRouter();
  const { toggle } = useSidebarStore();

  const handleLogout = () => {
    clearToken();
    Cookies.remove('access_token');
    router.push('/auth/login');
  };

  return (
    <header className='w-full flex justify-between items-center px-4 py-3 border-b border-border bg-background text-foreground'>
      <div className='flex items-center gap-2'>
        {/* Botón para abrir/cerrar sidebar solo en móvil */}
        <Button
          size='icon'
          variant='secondary'
          onClick={toggle}
          className='md:hidden'
        >
          <Menu className='w-5 h-5' />
        </Button>
        <h1 className='text-lg font-semibold'>💰 Finanzas Personales</h1>
      </div>

      <Button variant='secondary' size='sm' onClick={handleLogout}>
        <LogOut className='w-4 h-4 mr-1' />
        Cerrar sesión
      </Button>
    </header>
  );
}
