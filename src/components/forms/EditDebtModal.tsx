'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Debt, currencyType } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: Debt;
  onUpdated: () => void;
}

export default function EditDebtModal({
  open,
  onOpenChange,
  debt,
  onUpdated,
}: Props) {
  const [name, setName] = useState(debt.name);
  const [totalAmount, setTotalAmount] = useState(debt.total_amount.toString());
  const [interestRate, setInterestRate] = useState(
    debt.interest_rate.toString(),
  );
  const [dueDate, setDueDate] = useState(debt.due_date || '');
  const [currency, setCurrency] = useState<currencyType>(debt.currency);

  useEffect(() => {
    if (debt) {
      setName(debt.name);
      setTotalAmount(debt.total_amount.toString());
      setInterestRate(debt.interest_rate.toString());
      setDueDate(debt.due_date || '');
      setCurrency(debt.currency);
    }
  }, [debt]);

  const handleUpdate = async () => {
    if (!name || !totalAmount || !interestRate || !currency) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    try {
      await api.put(`/debts/${debt.id}`, {
        name,
        total_amount: parseFloat(totalAmount),
        interest_rate: parseFloat(interestRate),
        due_date: dueDate || null,
        currency,
      });
      toast.success('Deuda actualizada correctamente');
      onUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Error al actualizar deuda');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Deuda</DialogTitle>
        </DialogHeader>
        <div className='space-y-2'>
          <Input
            placeholder='Nombre'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder='Monto total'
            type='number'
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
          />
          <Input
            placeholder='Tasa de interés (%)'
            type='number'
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
          />
          <Input
            placeholder='Fecha de vencimiento (opcional)'
            type='date'
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <Select
            value={currency}
            onValueChange={(v) => setCurrency(v as currencyType)}
          >
            <SelectTrigger>
              <SelectValue placeholder='Moneda' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='COP'>COP - Peso Colombiano</SelectItem>
              <SelectItem value='USD'>USD - Dólar</SelectItem>
              <SelectItem value='EUR'>EUR - Euro</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleUpdate}>Actualizar Deuda</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
