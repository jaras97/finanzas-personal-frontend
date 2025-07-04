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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import axios from 'axios';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function NewDebtModal({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState<'COP' | 'USD' | 'EUR'>('COP');
  const [kind, setKind] = useState<'loan' | 'credit_card'>('loan'); // 🚩 nuevo estado

  const handleSubmit = async () => {
    if (!name || !totalAmount || !interestRate || !kind) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    try {
      await api.post('/debts', {
        name,
        total_amount: parseFloat(totalAmount),
        interest_rate: parseFloat(interestRate),
        due_date: dueDate || null,
        currency,
        kind, // 🚩 enviar tipo de deuda al backend
      });
      toast.success('Deuda creada correctamente');
      onCreated();
      onOpenChange(false);

      // Limpiar estados al cerrar
      setName('');
      setTotalAmount('');
      setInterestRate('');
      setDueDate('');
      setCurrency('COP');
      setKind('loan');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error?.response?.data?.detail || 'Error al crear deuda');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle>Nueva Deuda</DialogTitle>
        </DialogHeader>
        <div className='space-y-3'>
          <Input
            placeholder='Nombre de la deuda'
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
            onValueChange={(v) => setCurrency(v as 'COP' | 'USD' | 'EUR')}
          >
            <SelectTrigger>
              <SelectValue placeholder='Selecciona la moneda' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='COP'>COP - Peso Colombiano</SelectItem>
              <SelectItem value='USD'>USD - Dólar</SelectItem>
              <SelectItem value='EUR'>EUR - Euro</SelectItem>
            </SelectContent>
          </Select>

          {/* 🚩 Selector de tipo de deuda */}
          <Select
            value={kind}
            onValueChange={(v) => setKind(v as 'loan' | 'credit_card')}
          >
            <SelectTrigger>
              <SelectValue placeholder='Selecciona el tipo de deuda' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='loan'>Préstamo</SelectItem>
              <SelectItem value='credit_card'>Tarjeta de Crédito</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleSubmit} className='w-full'>
            Crear Deuda
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
