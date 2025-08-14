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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';
import { NumericFormat } from 'react-number-format';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function NewDebtModal({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [interestRate, setInterestRate] = useState(''); // opcional
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState<'COP' | 'USD' | 'EUR'>('COP');
  const [kind, setKind] = useState<'loan' | 'credit_card'>('loan');
  const [saving, setSaving] = useState(false);

  const parseNumber = (v: string) => {
    const n = parseFloat((v || '').replace(',', '.'));
    return isNaN(n) ? NaN : n;
  };

  const resetForm = () => {
    setName('');
    setTotalAmount('');
    setInterestRate('');
    setDueDate('');
    setCurrency('COP');
    setKind('loan');
  };

  const handleSubmit = async () => {
    const cleanedName = name.trim();
    if (!cleanedName) {
      toast.error('El nombre es obligatorio');
      return;
    }

    const amount = parseNumber(totalAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Ingresa un monto válido (≥ 0)');
      return;
    }

    const rate = interestRate.trim() === '' ? 0 : parseNumber(interestRate);
    if (isNaN(rate) || rate < 0) {
      toast.error('La tasa de interés debe ser un número ≥ 0');
      return;
    }

    const payload = {
      name: cleanedName,
      total_amount: amount,
      interest_rate: rate, // 🔹 opcional/informativa: si no se ingresa, va 0
      due_date: dueDate || null,
      currency,
      kind,
    };

    setSaving(true);
    try {
      await api.post('/debts', payload);
      toast.success('Deuda creada correctamente');
      onCreated();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error?.response?.data?.detail || 'Error al crear deuda');
      } else {
        toast.error('Error inesperado al crear deuda');
      }
    } finally {
      setSaving(false);
    }
  };

  // IDs para accesibilidad
  const idName = 'new-debt-name';
  const idAmount = 'new-debt-amount';
  const idRate = 'new-debt-rate';
  const idDue = 'new-debt-due';
  const idCurr = 'new-debt-currency';
  const idKind = 'new-debt-kind';

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className='max-w-sm bg-card text-foreground'>
        <DialogHeader>
          <DialogTitle>Nueva Deuda</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Nombre */}
          <div className='space-y-1'>
            <label htmlFor={idName} className='text-sm font-medium'>
              Nombre
            </label>
            <Input
              id={idName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Monto total */}
          <div className='space-y-1'>
            <label htmlFor={idAmount} className='text-sm font-medium'>
              Monto total
            </label>

            <NumericFormat
              id={idAmount}
              value={totalAmount}
              onValueChange={({ value }) => setTotalAmount(value)} // guarda el valor crudo (sin separadores, con punto decimal)
              thousandSeparator='.'
              decimalSeparator=','
              allowNegative={false}
              decimalScale={2}
              inputMode='decimal'
              customInput={Input} // usa tu mismo componente Input para conservar estilos
              disabled={saving}
            />
            <p className='text-xs text-muted-foreground'>
              Puedes iniciar en 0 si aún no hay saldo pendiente.
            </p>
          </div>

          {/* Tasa de interés */}
          <div className='space-y-1'>
            <label htmlFor={idRate} className='text-sm font-medium'>
              Tasa de interés (%){' '}
              <span className='font-normal text-muted-foreground'>
                (opcional / informativa)
              </span>
            </label>
            <Input
              id={idRate}
              type='number'
              inputMode='decimal'
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              disabled={saving}
            />
            <p className='text-xs text-muted-foreground'>
              No calcula intereses automáticamente; para intereses/cargos usa{' '}
              <b>Agregar Cargo</b>.
            </p>
          </div>

          {/* Fecha de vencimiento */}
          <div className='space-y-1'>
            <label htmlFor={idDue} className='text-sm font-medium'>
              Fecha de vencimiento{' '}
              <span className='font-normal text-muted-foreground'>
                (opcional)
              </span>
            </label>
            <Input
              id={idDue}
              type='date'
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Moneda */}
          <div className='space-y-1'>
            <label htmlFor={idCurr} className='text-sm font-medium'>
              Moneda
            </label>
            <Select
              value={currency}
              onValueChange={(v) => setCurrency(v as 'COP' | 'USD' | 'EUR')}
              disabled={saving}
            >
              <SelectTrigger id={idCurr}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='COP'>COP - Peso Colombiano</SelectItem>
                <SelectItem value='USD'>USD - Dólar</SelectItem>
                <SelectItem value='EUR'>EUR - Euro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de deuda */}
          <div className='space-y-1'>
            <label htmlFor={idKind} className='text-sm font-medium'>
              Tipo de deuda
            </label>
            <Select
              value={kind}
              onValueChange={(v) => setKind(v as 'loan' | 'credit_card')}
              disabled={saving}
            >
              <SelectTrigger id={idKind}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='loan'>Préstamo</SelectItem>
                <SelectItem value='credit_card'>Tarjeta de Crédito</SelectItem>
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground'>
              Las tarjetas no se cierran automáticamente al llegar a 0; puedes
              seguir usándolas.
            </p>
          </div>

          <Button onClick={handleSubmit} className='w-full' disabled={saving}>
            {saving ? 'Creando…' : 'Crear Deuda'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
