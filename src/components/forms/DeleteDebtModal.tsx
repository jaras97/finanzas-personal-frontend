'use client';

import { useState } from 'react';
import { DialogClose } from '@/components/ui/dialog';
import { FormModal } from '@/components/ui/form-modal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Debt } from '@/types';
import axios from 'axios';

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

  return (
    <FormModal
      open={open}
      onOpenChange={(o) => !deleting && onOpenChange(o)}
      size='md'
      className='w-[min(100vw-1rem,520px)]'
      tone='rose'
      title='Eliminar Deuda'
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
      <p className='text-sm'>
        ¿Estás seguro de que deseas eliminar <strong>{debt.name}</strong>?
        Esta acción no se puede deshacer.
      </p>
    </FormModal>
  );
}
