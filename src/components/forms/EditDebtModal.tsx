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
import InfoHint from '@/components/ui/info-hint';
import { cn } from '@/lib/utils';

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
    if (saving) return;

    const cleanedName = name.trim();
    if (!cleanedName) {
      toast.error('El nombre es obligatorio');
      return;
    }

    // Payload (si hay movimientos, bloqueamos monto/moneda)
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
      <DialogContent
        className={cn('w-[min(100vw-1rem,520px)] p-0 bg-card text-foreground')}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => saving && e.preventDefault()}
        onEscapeKeyDown={(e) => saving && e.preventDefault()}
      >
        <div
          className={cn(
            'max-h-[85dvh] sm:max-h-[80vh]',
            'overflow-y-auto overscroll-contain',
            'px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]',
          )}
          aria-busy={saving}
        >
          <DialogHeader>
            <DialogTitle>Editar Deuda</DialogTitle>
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
                  Saldo actual de la deuda. Si ya existen movimientos, no puede
                  modificarse.
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
                disabled={saving || hasTransactions}
              />
              {hasTransactions && (
                <p className='text-xs text-muted-foreground'>
                  No puedes editar el monto porque esta deuda tiene movimientos.
                </p>
              )}
            </div>

            {/* Tasa de interés */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idRate} className='text-sm font-medium'>
                  Tasa de interés (%)
                </label>
                <InfoHint side='top'>
                  Campo <b>opcional</b> e <b>informativo</b>. No calcula
                  intereses automáticamente.
                </InfoHint>
              </div>
              <NumericFormat
                id={idRate}
                value={interestRate}
                onValueChange={({ value }) => setInterestRate(value)}
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
                <InfoHint side='top'>Opcional. Solo referencia.</InfoHint>
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
                <label className='text-sm font-medium' htmlFor={idCurrency}>
                  Moneda
                </label>
                <InfoHint side='top'>
                  Afecta con qué cuentas puedes pagar esta deuda. Si hay
                  movimientos, no puede cambiarse.
                </InfoHint>
              </div>
              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v as currencyType)}
                disabled={saving || hasTransactions}
              >
                <SelectTrigger id={idCurrency}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='COP'>COP — Peso Colombiano</SelectItem>
                  <SelectItem value='USD'>USD — Dólar</SelectItem>
                  <SelectItem value='EUR'>EUR — Euro</SelectItem>
                </SelectContent>
              </Select>
              {hasTransactions ? (
                <p className='text-xs text-muted-foreground'>
                  No puedes cambiar la moneda porque esta deuda tiene
                  movimientos.
                </p>
              ) : (
                <p className='text-xs text-emerald-600'>
                  Deuda prístina: puedes ajustar <b>moneda</b> y <b>monto</b>{' '}
                  sin afectar la trazabilidad.
                </p>
              )}
            </div>

            <Button
              onClick={handleUpdate}
              className='w-full'
              disabled={saving}
              aria-disabled={saving}
            >
              {saving ? 'Guardando…' : 'Actualizar Deuda'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
