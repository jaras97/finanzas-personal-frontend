'use client';

import { useState, useMemo } from 'react';
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
import { formatCurrency } from '@/lib/format';
import { toIsoAtLocalNoon } from '@/utils/dates';
import { NumericFormat } from 'react-number-format';

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
  const [saving, setSaving] = useState(false);

  const isClosed = useMemo(() => debt.status === 'closed', [debt.status]);

  const parseNumber = (v: string) => {
    const n = parseFloat((v || '').replace(',', '.'));
    return isNaN(n) ? NaN : n;
  };

  const handleAddCharge = async () => {
    const amt = parseNumber(amount);

    if (isClosed) {
      toast.error('La deuda está cerrada. Reábrela para agregar cargos.');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      toast.error('Ingresa un monto válido (> 0)');
      return;
    }

    setSaving(true);
    try {
      await api.post(`/debts/${debt.id}/add-charge`, {
        amount: amt,
        description: (description || 'Cargo adicional').trim(),
        date: date ? toIsoAtLocalNoon(date) : undefined,
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
      } else {
        toast.error('Error inesperado al agregar cargo');
      }
    } finally {
      setSaving(false);
    }
  };

  // IDs accesibles
  const idDate = 'add-charge-date';
  const idAmount = 'add-charge-amount';
  const idDesc = 'add-charge-desc';

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className='max-w-sm bg-card text-foreground'>
        <DialogHeader>
          <DialogTitle>Agregar cargo a {debt.name}</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <p className='text-xs text-muted-foreground'>
            Saldo actual:{' '}
            <b>
              {formatCurrency(debt.total_amount)} {debt.currency}
            </b>
          </p>

          {/* Fecha */}
          <div className='space-y-1'>
            <label htmlFor={idDate} className='text-sm font-medium'>
              Fecha del cargo{' '}
              <span className='font-normal text-muted-foreground'>
                (opcional)
              </span>
            </label>
            <Input
              id={idDate}
              type='date'
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Monto */}
          <div className='space-y-1'>
            <label htmlFor={idAmount} className='text-sm font-medium'>
              Monto del cargo ({debt.currency})
            </label>

            <NumericFormat
              id={idAmount}
              value={amount}
              onValueChange={({ value }) => setAmount(value)} // guarda el valor crudo (sin separadores, con punto decimal)
              thousandSeparator='.'
              decimalSeparator=','
              allowNegative={false}
              decimalScale={2}
              inputMode='decimal'
              customInput={Input} // usa tu mismo componente Input para conservar estilos
              disabled={saving}
            />
          </div>

          {/* Descripción */}
          <div className='space-y-1'>
            <label htmlFor={idDesc} className='text-sm font-medium'>
              Descripción{' '}
              <span className='font-normal text-muted-foreground'>
                (opcional)
              </span>
            </label>
            <Input
              id={idDesc}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
            />
            <p className='text-xs text-muted-foreground'>
              Este cargo aumenta el saldo de la deuda y se registra como
              movimiento de deuda.
              <br />
              <b>No</b> afecta ninguna cuenta hasta que realices un pago.
            </p>
          </div>

          {isClosed && (
            <p className='text-xs text-amber-600'>
              La deuda está cerrada. Usa <b>Reabrir</b> para poder agregar
              cargos.
            </p>
          )}

          <Button
            onClick={handleAddCharge}
            className='w-full'
            disabled={saving || isClosed}
          >
            {saving ? 'Agregando…' : 'Agregar Cargo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
