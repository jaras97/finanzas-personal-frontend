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
import { Debt } from '@/types';
import axios from 'axios';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: Debt;
  onDeleted: () => void;
}

export default function DeleteDebtModal({
  open,
  onOpenChange,
  debt,
  onDeleted,
}: Props) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await api.delete(`/debts/${debt.id}`);
      toast.success('Deuda eliminada correctamente');
      onDeleted();
      onOpenChange(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const detail = error?.response?.data?.detail;
        toast.error(
          typeof detail === 'string' && detail.trim()
            ? detail
            : 'Error al eliminar la deuda',
        );
      } else {
        toast.error('Error inesperado al eliminar la deuda');
      }
    } finally {
      setDeleting(false);
    }
  };

  // 🎨 Tinte destructivo coherente con los demás modales
  const panelTint = 'bg-rose-50';
  const headerFooterTint = 'bg-rose-100';
  const ctaClass =
    'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300';

  return (
    <Dialog open={open} onOpenChange={(o) => !deleting && onOpenChange(o)}>
      <DialogContent
        size='md'
        className={cn(
          // layout header | body | footer
          'grid grid-rows-[auto,1fr,auto] max-h-[92dvh]',
          // tamaño / borde / evitar solapamiento
          'w-[min(100vw-1rem,520px)] rounded-2xl overflow-hidden',
          panelTint,
        )}
      >
        {/* HEADER */}
        <header className={cn('border-b px-4 py-3', headerFooterTint)}>
          <DialogTitle className='text-base sm:text-lg font-semibold'>
            Eliminar Deuda
          </DialogTitle>
        </header>

        {/* BODY (scroll) */}
        <section className='overflow-y-auto overscroll-contain px-4 py-4'>
          <div className='space-y-4 text-sm'>
            <p>
              ¿Estás seguro de que deseas eliminar <strong>{debt.name}</strong>?
              Esta acción no se puede deshacer.
            </p>
          </div>
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
