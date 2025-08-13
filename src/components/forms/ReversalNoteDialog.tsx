'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Nota de reversa</DialogTitle>
        </DialogHeader>

        <div className='space-y-2'>
          <p className='text-sm text-muted-foreground'>
            Transacción #{tx?.id} — {tx?.description || 'Sin descripción'}
          </p>
          <div className='rounded-md border border-border bg-muted/30 p-3 text-sm whitespace-pre-wrap'>
            {note || 'Sin nota de reversa.'}
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
