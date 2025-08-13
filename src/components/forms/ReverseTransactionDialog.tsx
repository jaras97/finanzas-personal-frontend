'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reversar transacción</DialogTitle>
        </DialogHeader>

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
          />
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant='destructive'
            onClick={async () => {
              setLoading(true);
              try {
                await onConfirm(note.trim());
                onOpenChange(false);
                setNote('');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            Reversar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
