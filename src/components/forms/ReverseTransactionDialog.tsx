'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  description?: string | null;
  onConfirm: (note: string) => Promise<void> | void;
};

export default function ReverseTransactionDialog({
  open,
  onOpenChange,
  description,
  onConfirm,
}: Props) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  // Tinte destructivo (rose)
  const panelTint = 'bg-rose-50';
  const headerFooterTint = 'bg-rose-100';

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(note.trim());
      onOpenChange(false);
      setNote('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent
        className={cn(
          'w-[min(100vw-1rem,520px)]',
          'grid grid-rows-[auto,1fr,auto] max-h-[92dvh]',
          'rounded-2xl overflow-hidden', // evita solapamientos de borde
          panelTint,
        )}
      >
        {/* HEADER (tinte más oscuro) */}
        <DialogHeader className={cn('border-b px-4 py-3', headerFooterTint)}>
          <DialogTitle>Reversar transacción</DialogTitle>
        </DialogHeader>

        {/* BODY (scroll solo aquí) */}
        <section
          className='overflow-y-auto overscroll-contain px-4 py-4 space-y-4'
          aria-busy={loading}
        >
          {description && (
            <p className='text-sm text-muted-foreground'>
              Vas a reversar: <span className='font-medium'>{description}</span>
            </p>
          )}

          <div className='space-y-2'>
            <label className='text-sm font-medium'>
              Motivo / Nota (opcional)
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder='Describe brevemente el motivo de la reversión...'
              disabled={loading}
              className='bg-white'
            />
          </div>
        </section>

        {/* FOOTER (tinte más oscuro) */}
        <DialogFooter className={cn('border-t px-4 py-3', headerFooterTint)}>
          <DialogClose asChild>
            <Button
              className='bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 sm:min-w-[120px]'
              disabled={loading}
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            aria-disabled={loading}
            className='sm:min-w-[140px] bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300'
          >
            {loading ? 'Reversando…' : 'Reversar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
