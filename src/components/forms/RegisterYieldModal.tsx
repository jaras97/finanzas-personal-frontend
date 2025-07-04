// components/forms/RegisterYieldModal.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export default function RegisterYieldModal({
  open,
  onOpenChange,
  account,
  onCompleted,
}: Props) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Rendimiento de inversión');

  const handleRegisterYield = async () => {
    if (!amount) {
      toast.error('Ingresa un monto');
      return;
    }
    try {
      await api.post(`/transactions/register-yield/${account.id}`, {
        amount: parseFloat(amount),
        description,
      });
      toast.success('Rendimiento registrado correctamente');
      onOpenChange(false);
      onCompleted();
      setAmount('');
      setDescription('Rendimiento de inversión');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error?.response?.data?.detail || 'Error al registrar rendimiento',
        );
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='bg-card text-foreground'>
        <DialogHeader>
          <DialogTitle>
            Registrar rendimiento en{' '}
            <span className='font-semibold'>{account.name}</span>
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-3'>
          <Input
            placeholder='Monto del rendimiento'
            type='number'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            placeholder='Descripción (opcional)'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button onClick={handleRegisterYield} className='w-full'>
            Registrar rendimiento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
