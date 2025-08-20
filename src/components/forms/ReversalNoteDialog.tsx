'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TransactionWithCategoryRead } from '@/types';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tx: TransactionWithCategoryRead | null;
};

export default function ReversalNoteDialog({ open, onOpenChange, tx }: Props) {
  const note = tx?.reversal_note ?? '';

  // Tinte de “estado revertido”
  const panelTint = 'bg-rose-50';
  const headerFooterTint = 'bg-rose-100';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'w-[min(100vw-1rem,520px)]',
          'grid grid-rows-[auto,1fr,auto] max-h-[92dvh]',
          'rounded-2xl overflow-hidden', // evita solapamiento con esquinas
          panelTint,
        )}
      >
        {/* HEADER */}
        <DialogHeader className={cn('border-b px-4 py-3', headerFooterTint)}>
          <DialogTitle>Nota de reversa</DialogTitle>
        </DialogHeader>

        {/* BODY (scroll solo aquí) */}
        <section className='overflow-y-auto overscroll-contain px-4 py-4 space-y-3'>
          <p className='text-sm text-muted-foreground'>
            Transacción #{tx?.id ?? '—'} —{' '}
            {tx?.description || 'Sin descripción'}
          </p>

          {/* Contenedor de nota con contraste */}
          <div className='rounded-md border border-border bg-white p-3 text-sm whitespace-pre-wrap'>
            {note || 'Sin nota de reversa.'}
          </div>
        </section>

        {/* FOOTER */}
        <DialogFooter className={cn('border-t px-4 py-3', headerFooterTint)}>
          <DialogClose asChild>
            <Button className='bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 sm:min-w-[120px]'>
              Cerrar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
