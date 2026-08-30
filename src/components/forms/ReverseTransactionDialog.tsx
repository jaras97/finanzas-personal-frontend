'use client';

import { useState } from 'react';
import { DialogClose } from '@/components/ui/dialog';
import { FormModal } from '@/components/ui/form-modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

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
    <FormModal
      open={open}
      onOpenChange={(v) => !loading && onOpenChange(v)}
      className='w-[min(100vw-1rem,520px)]'
      tone='rose'
      title='Reversar transacción'
      footer={
        <>
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
        </>
      }
    >
      <div className='space-y-4' aria-busy={loading}>
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
      </div>
    </FormModal>
  );
}
