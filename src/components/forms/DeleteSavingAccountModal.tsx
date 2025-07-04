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
  const handleDelete = async () => {
    try {
      await api.delete(`/saving-accounts/${account.id}`);
      toast.success('Cuenta eliminada correctamente');
      onOpenChange(false);
      onDeleted();
    } catch (error) {
      console.error('Error al eliminar cuenta:', error);
      if (axios.isAxiosError(error)) {
        if (axios.isAxiosError(error)) {
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
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='bg-card text-foreground'>
        <DialogHeader>
          <DialogTitle>Eliminar cuenta</DialogTitle>
        </DialogHeader>
        <p className='text-sm text-muted-foreground'>
          ¿Estás seguro de que deseas eliminar{' '}
          <span className='font-semibold'>{account.name}</span>?
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
