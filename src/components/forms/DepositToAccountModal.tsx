'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';
import { SavingAccount } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: SavingAccount;
  onCompleted: () => void;
}

export default function DepositToAccountModal({
  open,
  onOpenChange,
  account,
  onCompleted,
}: Props) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleDeposit = async () => {
    if (!amount) {
      toast.error('Ingresa un monto');
      return;
    }

    try {
      await api.post(`/saving-accounts/${account.id}/deposit`, {
        amount: parseFloat(amount),
        description,
      });
      toast.success('Depósito realizado correctamente');
      onOpenChange(false);
      onCompleted();
      setAmount('');
      setDescription('');
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || 'Error al realizar depósito',
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='bg-card text-foreground'>
        <DialogHeader>
          <DialogTitle>Depositar en {account.name}</DialogTitle>
        </DialogHeader>
        <div className='space-y-3'>
          <Input
            placeholder='Monto'
            type='number'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            placeholder='Descripción (opcional)'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button onClick={handleDeposit} className='w-full'>
            Depositar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
