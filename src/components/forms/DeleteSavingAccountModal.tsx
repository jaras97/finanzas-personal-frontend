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
import { SavingAccount } from '@/types';

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
  const handleDelete = async () => {
    try {
      await api.delete(`/saving-accounts/${account.id}`);
      toast.success('Cuenta eliminada correctamente');
      onOpenChange(false);
      onDeleted();
    } catch (error: any) {
      console.error('Error al eliminar cuenta:', error);
      if (
        error?.response?.data?.detail?.includes(
          'violates foreign key constraint',
        ) ||
        error?.response?.data?.detail?.includes(
          'referenced from table "transaction"',
        )
      ) {
        toast.error(
          'No puedes eliminar esta cuenta porque tiene transacciones asociadas.',
        );
      } else {
        toast.error(
          error?.response?.data?.detail || 'Error al eliminar la cuenta.',
        );
      }
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar cuenta</DialogTitle>
        </DialogHeader>
        <p>
          ¿Estás seguro de que deseas eliminar <strong>{account.name}</strong>?
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
