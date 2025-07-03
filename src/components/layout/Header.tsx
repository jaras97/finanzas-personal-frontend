'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';
import { LogOut } from 'lucide-react';
import Cookies from 'js-cookie';

export default function Header() {
  const { clearToken } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    Cookies.remove('access_token');
    router.push('/auth/login');
  };

  return (
    <header className='w-full flex justify-between items-center p-4 border-b bg-white'>
      <h1 className='text-lg font-semibold'>💰 Finanzas Personales</h1>
      <Button variant='outline' size='sm' onClick={handleLogout}>
        <LogOut className='w-4 h-4 mr-1' />
        Cerrar sesión
      </Button>
    </header>
  );
}
