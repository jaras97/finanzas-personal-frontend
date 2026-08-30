'use client';

import { DialogClose } from '@/components/ui/dialog';
import { FormModal } from '@/components/ui/form-modal';
import { Button } from '@/components/ui/button';
import { TransactionWithCategoryRead } from '@/types';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tx: TransactionWithCategoryRead | null;
};

export default function ReversalNoteDialog({ open, onOpenChange, tx }: Props) {
  const note = tx?.reversal_note ?? '';

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      className='w-[min(100vw-1rem,520px)]'
      tone='rose'
      title='Nota de reversa'
      footer={
        <DialogClose asChild>
          <Button className='bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 sm:min-w-[120px]'>
            Cerrar
          </Button>
        </DialogClose>
      }
    >
      <div className='space-y-3'>
        <p className='text-sm text-muted-foreground'>
          Transacción #{tx?.id ?? '—'} —{' '}
          {tx?.description || 'Sin descripción'}
        </p>

        {/* Contenedor de nota con contraste */}
        <div className='rounded-md border border-border bg-white p-3 text-sm whitespace-pre-wrap'>
          {note || 'Sin nota de reversa.'}
        </div>
      </div>
    </FormModal>
  );
}
