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
import { Debt } from '@/types';
import axios from 'axios';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: Debt;
  onCompleted: () => void;
}

export default function AddChargeToDebtModal({
  open,
  onOpenChange,
  debt,
  onCompleted,
}: Props) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');

  const handleAddCharge = async () => {
    if (!amount) {
      toast.error('Ingresa un monto');
      return;
    }

    try {
      await api.post(`/debts/${debt.id}/add-charge`, {
        amount: parseFloat(amount),
        description: description || 'Cargo adicional',
        date: date ? new Date(date).toISOString() : undefined,
      });
      toast.success('Cargo agregado correctamente');
      onCompleted();
      onOpenChange(false);
      setAmount('');
      setDescription('');
      setDate('');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error?.response?.data?.detail || 'Error al agregar cargo');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle>Agregar cargo a {debt.name}</DialogTitle>
        </DialogHeader>
        <div className='space-y-3'>
          <Input
            type='date'
            placeholder='Fecha del cargo (opcional)'
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            placeholder={`Monto del cargo (${debt.currency})`}
            type='number'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            placeholder='Descripción (opcional)'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button onClick={handleAddCharge} className='w-full'>
            Agregar Cargo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
