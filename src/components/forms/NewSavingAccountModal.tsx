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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function NewSavingAccountModal({
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'investment'>('cash');
  const [currency, setCurrency] = useState<'COP' | 'USD' | 'EUR'>('COP');

  const handleSubmit = async () => {
    if (!name || !balance || !type || !currency) {
      toast.error('Completa todos los campos');
      return;
    }

    try {
      await api.post('/saving-accounts', {
        name,
        balance: parseFloat(balance),
        type,
        currency,
      });
      toast.success('Cuenta creada correctamente');
      onCreated();
      onOpenChange(false);
      setName('');
      setBalance('');
      setType('cash');
      setCurrency('COP');
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Error al crear cuenta');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='bg-card text-foreground'>
        <DialogHeader>
          <DialogTitle>Nueva cuenta</DialogTitle>
        </DialogHeader>
        <div className='space-y-3'>
          <Input
            placeholder='Nombre de la cuenta'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder='Saldo inicial'
            type='number'
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />
          <Select
            value={type}
            onValueChange={(v) => setType(v as 'cash' | 'bank' | 'investment')}
          >
            <SelectTrigger>
              <SelectValue placeholder='Tipo de cuenta' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='cash'>Efectivo</SelectItem>
              <SelectItem value='bank'>Banco</SelectItem>
              <SelectItem value='investment'>Inversión</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={currency}
            onValueChange={(v) => setCurrency(v as 'COP' | 'USD' | 'EUR')}
          >
            <SelectTrigger>
              <SelectValue placeholder='Moneda' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='COP'>COP - Peso colombiano</SelectItem>
              <SelectItem value='USD'>USD - Dólar</SelectItem>
              <SelectItem value='EUR'>EUR - Euro</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSubmit} className='w-full'>
            Crear cuenta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
