'use client';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useSidebarStore } from '@/lib/store/sidebarStore';

export function MobileSidebarTrigger() {
  const { toggle } = useSidebarStore();
  return (
    <Button
      type='button'
      onClick={toggle}
      size='icon'
      className='md:hidden fixed left-3 top-[calc(env(safe-area-inset-top)+12px)] z-40 rounded-full shadow-lg'
    >
      <Menu className='w-5 h-5' />
    </Button>
  );
}
