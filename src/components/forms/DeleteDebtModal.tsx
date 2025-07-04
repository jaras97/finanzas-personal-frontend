'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  const handleDelete = async () => {
    try {
      await api.delete(`/debts/${debt.id}`);
      toast.success('Deuda eliminada correctamente');
      onDeleted();
      onOpenChange(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error?.response?.data?.detail || 'Error al eliminar la deuda',
        );
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle>Eliminar Deuda</DialogTitle>
        </DialogHeader>

        <div className='space-y-4 text-sm'>
          <p>
            ¿Estás seguro de que deseas eliminar <strong>{debt.name}</strong>?
          </p>

          <div className='flex justify-end gap-2'>
            <Button variant='outline' onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button variant='destructive' onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
