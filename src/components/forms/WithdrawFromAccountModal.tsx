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
import axios from 'axios';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: SavingAccount;
  onCompleted: () => void;
}

export default function WithdrawFromAccountModal({
  open,
  onOpenChange,
  account,
  onCompleted,
}: Props) {
  const [amount, setAmount] = useState('');

  const handleWithdraw = async () => {
    if (!amount) {
      toast.error('Ingresa un monto');
      return;
    }

    try {
      await api.post(`/saving-accounts/${account.id}/withdraw`, {
        amount: parseFloat(amount),
      });
      toast.success('Retiro realizado correctamente');
      onOpenChange(false);
      onCompleted();
      setAmount('');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error?.response?.data?.detail || 'Error al realizar retiro',
        );
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retirar de {account.name}</DialogTitle>
        </DialogHeader>
        <div className='space-y-2'>
          <Input
            placeholder='Monto'
            type='number'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button onClick={handleWithdraw}>Retirar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
