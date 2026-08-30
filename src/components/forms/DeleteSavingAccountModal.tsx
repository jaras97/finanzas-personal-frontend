'use client';

import { useState } from 'react';
import { DialogClose } from '@/components/ui/dialog';
import { FormModal } from '@/components/ui/form-modal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';
import { SavingAccount } from '@/types';
import axios from 'axios';

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

  return (
    <FormModal
      open={open}
      onOpenChange={(o) => !deleting && onOpenChange(o)}
      size='md'
      className='w-[min(100vw-1rem,520px)]'
      tone='rose'
      title='Eliminar cuenta'
      footer={
        <>
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
            className='bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300 sm:min-w-[140px]'
          >
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </>
      }
    >
      <p className='text-sm text-muted-foreground'>
        ¿Estás seguro de que deseas eliminar{' '}
        <span className='font-semibold'>{account.name}</span>? Esta acción
        no se puede deshacer.
      </p>
    </FormModal>
  );
}
