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
import InfoHint from '@/components/ui/info-hint';
import { cn } from '@/lib/utils';

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
    if (saving) return;

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
      interest_rate: rate, // opcional / informativa
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

  // IDs accesibles
  const idName = 'new-debt-name';
  const idAmount = 'new-debt-amount';
  const idRate = 'new-debt-rate';
  const idDue = 'new-debt-due';
  const idCurr = 'new-debt-currency';
  const idKind = 'new-debt-kind';

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent
        className={cn('w-[min(100vw-1rem,520px)] p-0 bg-card text-foreground')}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => saving && e.preventDefault()}
        onEscapeKeyDown={(e) => saving && e.preventDefault()}
      >
        {/* Contenedor interno scrollable para mobile/teclado */}
        <div
          className={cn(
            'max-h-[85dvh] sm:max-h-[80vh]',
            'overflow-y-auto overscroll-contain',
            'px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]',
          )}
          aria-busy={saving}
        >
          <DialogHeader>
            <DialogTitle>Nueva Deuda</DialogTitle>
          </DialogHeader>

          <div className='space-y-4 mt-2'>
            {/* Nombre */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idName} className='text-sm font-medium'>
                  Nombre
                </label>
                <InfoHint side='top'>
                  Ej: “Préstamo carro” o “Visa Banco X”.
                </InfoHint>
              </div>
              <Input
                id={idName}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
              />
            </div>

            {/* Monto total */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idAmount} className='text-sm font-medium'>
                  Monto total
                </label>
                <InfoHint side='top'>
                  Saldo actual de la deuda. Puedes iniciar en <b>0</b>.
                </InfoHint>
              </div>
              <NumericFormat
                id={idAmount}
                value={totalAmount}
                onValueChange={({ value }) => setTotalAmount(value)}
                thousandSeparator='.'
                decimalSeparator=','
                allowNegative={false}
                decimalScale={2}
                inputMode='decimal'
                customInput={Input}
                disabled={saving}
              />
            </div>

            {/* Tasa de interés (opcional) */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idRate} className='text-sm font-medium'>
                  Tasa de interés (%)
                </label>
                <InfoHint side='top'>
                  Campo <b>opcional</b> y <b>informativo</b>. No calcula
                  intereses automáticos. Para intereses/cargos usa{' '}
                  <b>Agregar Cargo</b>.
                </InfoHint>
              </div>
              <NumericFormat
                id={idRate}
                value={interestRate}
                onValueChange={({ value }) => setInterestRate(value)}
                // porcentaje: sin miles, 2 decimales
                decimalSeparator=','
                allowNegative={false}
                decimalScale={2}
                inputMode='decimal'
                customInput={Input}
                disabled={saving}
              />
            </div>

            {/* Fecha de vencimiento */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idDue} className='text-sm font-medium'>
                  Fecha de vencimiento
                </label>
                <InfoHint side='top'>
                  Opcional. Úsala como referencia/recordatorio.
                </InfoHint>
              </div>
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
              <div className='flex items-center gap-2'>
                <label htmlFor={idCurr} className='text-sm font-medium'>
                  Moneda
                </label>
                <InfoHint side='top'>
                  Determina qué cuentas podrás usar al pagar esta deuda.
                </InfoHint>
              </div>
              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v as 'COP' | 'USD' | 'EUR')}
                disabled={saving}
              >
                <SelectTrigger id={idCurr}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='COP'>COP — Peso Colombiano</SelectItem>
                  <SelectItem value='USD'>USD — Dólar</SelectItem>
                  <SelectItem value='EUR'>EUR — Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de deuda */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idKind} className='text-sm font-medium'>
                  Tipo de deuda
                </label>
                <InfoHint side='top'>
                  Las tarjetas no se cierran automáticamente al llegar a 0;
                  puedes seguir usándolas.
                </InfoHint>
              </div>
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
                  <SelectItem value='credit_card'>
                    Tarjeta de Crédito
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSubmit}
              className='w-full'
              disabled={saving}
              aria-disabled={saving}
            >
              {saving ? 'Creando…' : 'Crear Deuda'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
