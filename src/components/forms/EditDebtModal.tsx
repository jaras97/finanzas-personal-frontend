'use client';

import { useEffect, useMemo, useState } from 'react';
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
import axios from 'axios';
import { NumericFormat } from 'react-number-format';

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
    (debt.interest_rate ?? 0).toString(),
  );
  const [dueDate, setDueDate] = useState(debt.due_date || '');
  const [currency, setCurrency] = useState<currencyType>(debt.currency);
  const [saving, setSaving] = useState(false);

  const hasTransactions = useMemo(
    () => (debt.transactions_count ?? 0) > 0,
    [debt.transactions_count],
  );

  // Reset en cada cambio de deuda
  useEffect(() => {
    if (!debt) return;
    setName(debt.name);
    setTotalAmount(debt.total_amount.toString());
    setInterestRate((debt.interest_rate ?? 0).toString());
    setDueDate(debt.due_date || '');
    setCurrency(debt.currency);
  }, [debt?.id]);

  const parseNumber = (v: string) => {
    const n = parseFloat((v || '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
  };

  const handleUpdate = async () => {
    const cleanedName = name.trim();
    if (!cleanedName) {
      toast.error('El nombre es obligatorio');
      return;
    }

    // Payload completo (backend espera DebtCreate); si hay movimientos, no cambiamos monto/moneda
    const payload = {
      name: cleanedName,
      total_amount: hasTransactions
        ? debt.total_amount
        : parseNumber(totalAmount),
      interest_rate: parseNumber(interestRate),
      due_date: dueDate || null,
      currency: hasTransactions ? debt.currency : currency,
      kind: debt.kind,
    };

    setSaving(true);
    try {
      await api.put(`/debts/${debt.id}`, payload);
      toast.success('Deuda actualizada correctamente');
      onUpdated();
      onOpenChange(false);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error?.response?.data?.detail || 'Error al actualizar deuda',
        );
      } else {
        toast.error('Error inesperado al actualizar deuda');
      }
    } finally {
      setSaving(false);
    }
  };

  // IDs para accesibilidad
  const idName = 'edit-debt-name';
  const idAmount = 'edit-debt-total-amount';
  const idRate = 'edit-debt-interest-rate';
  const idDue = 'edit-debt-due-date';
  const idCurrency = 'edit-debt-currency';

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className='max-w-sm bg-card text-foreground'>
        <DialogHeader>
          <DialogTitle>Editar Deuda</DialogTitle>
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
            {hasTransactions && (
              <p className='text-xs text-muted-foreground'>
                No puedes editar el monto porque esta deuda tiene movimientos.
              </p>
            )}
          </div>

          {/* Tasa de interés */}
          <div className='space-y-1'>
            <label htmlFor={idRate} className='text-sm font-medium'>
              Tasa de interés (%){' '}
              <span className='text-muted-foreground font-normal'>
                (opcional)
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
          </div>

          {/* Fecha de vencimiento */}
          <div className='space-y-1'>
            <label htmlFor={idDue} className='text-sm font-medium'>
              Fecha de vencimiento{' '}
              <span className='text-muted-foreground font-normal'>
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
            <label className='text-sm font-medium' htmlFor={idCurrency}>
              Moneda
            </label>
            <Select
              value={currency}
              onValueChange={(v) => setCurrency(v as currencyType)}
              disabled={saving || hasTransactions}
            >
              <SelectTrigger id={idCurrency}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='COP'>COP - Peso Colombiano</SelectItem>
                <SelectItem value='USD'>USD - Dólar</SelectItem>
                <SelectItem value='EUR'>EUR - Euro</SelectItem>
              </SelectContent>
            </Select>
            {hasTransactions ? (
              <p className='text-xs text-muted-foreground'>
                No puedes cambiar la moneda porque esta deuda tiene movimientos.
              </p>
            ) : (
              <p className='text-xs text-emerald-600'>
                Deuda prístina: puedes ajustar moneda y monto sin afectar la
                trazabilidad.
              </p>
            )}
          </div>

          <Button onClick={handleUpdate} className='w-full' disabled={saving}>
            {saving ? 'Guardando…' : 'Actualizar Deuda'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
