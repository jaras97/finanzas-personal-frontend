'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';
import { SavingAccount } from '@/types';
import axios from 'axios';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: SavingAccount;
  onDeleted: () => void;
}

export default function DeleteSavingAccountModal({
  open,
  onOpenChange,
  account,
  onDeleted,
}: Props) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/saving-accounts/${account.id}`);
      toast.success('Cuenta eliminada correctamente');
      onOpenChange(false);
      onDeleted();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const detail = String(error?.response?.data?.detail || '');
        if (
          detail.includes('foreign key') ||
          detail.includes('referenced from table') ||
          detail.toLowerCase().includes('transaction')
        ) {
          toast.error(
            'No puedes eliminar esta cuenta porque tiene transacciones asociadas.',
          );
        } else {
          toast.error(detail || 'Error al eliminar la cuenta.');
        }
      } else {
        toast.error('Error inesperado al eliminar la cuenta.');
      }
    } finally {
      setDeleting(false);
    }
  };

  // 🎨 Tinte destructivo
  const panelTint = 'bg-rose-50';
  const headerFooterTint = 'bg-rose-100';
  const ctaClass =
    'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300';

  return (
    <Dialog open={open} onOpenChange={(o) => !deleting && onOpenChange(o)}>
      <DialogContent
        // ⚠️ Solo props soportadas por nuestro wrapper (Headless UI)
        className={cn(
          'grid grid-rows-[auto,1fr,auto] max-h-[92dvh]',
          'w-[min(100vw-1rem,520px)] rounded-2xl overflow-hidden',
          panelTint,
        )}
        size='md'
      >
        {/* HEADER */}
        <header className={cn('border-b px-4 py-3', headerFooterTint)}>
          <DialogTitle className='text-base sm:text-lg font-semibold'>
            Eliminar cuenta
          </DialogTitle>
        </header>

        {/* BODY */}
        <section className='overflow-y-auto overscroll-contain px-4 py-4'>
          <p className='text-sm text-muted-foreground'>
            ¿Estás seguro de que deseas eliminar{' '}
            <span className='font-semibold'>{account.name}</span>? Esta acción
            no se puede deshacer.
          </p>
        </section>

        {/* FOOTER */}
        <footer className={cn('border-t', headerFooterTint)}>
          <div className='px-4 py-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <DialogClose asChild>
              <Button
                className='bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 sm:min-w-[120px]'
                disabled={deleting}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              aria-disabled={deleting}
              className={cn('sm:min-w-[140px]', ctaClass)}
            >
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
