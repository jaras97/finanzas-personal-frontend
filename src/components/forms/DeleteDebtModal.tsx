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
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || 'Error al eliminar la deuda',
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar deuda</DialogTitle>
        </DialogHeader>
        <p>
          ¿Estás seguro de que deseas eliminar <strong>{debt.name}</strong>?
        </p>
        <div className='flex justify-end gap-2 mt-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant='destructive' onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
