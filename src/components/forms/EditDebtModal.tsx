'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
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
import { DatePicker } from '@/components/ui/date-picker';
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
  const [dueDate, setDueDate] = useState<Date | undefined>(
    debt.due_date ? ymdToLocalDate(debt.due_date) : undefined,
  );
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
    setDueDate(debt.due_date ? ymdToLocalDate(debt.due_date) : undefined);
    setCurrency(debt.currency);
  }, [debt?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const parseNumber = (v: string) => {
    const n = parseFloat((v || '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
  };

  // Evitar toasts con objetos (422)
  const extractApiError = (err: unknown) => {
    if (axios.isAxiosError(err)) {
      const data: any = err.response?.data;
      const detail =
        data?.detail ?? data?.message ?? data?.error ?? data?.errors;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail)) {
        const msgs = detail.map((e: any) => e?.msg).filter(Boolean);
        if (msgs.length) return msgs.join(' • ');
      }
      try {
        return JSON.stringify(detail ?? data ?? err);
      } catch {
        return (err as any)?.message || 'Error inesperado';
      }
    }
    return 'Error inesperado';
  };

  const handleUpdate = async () => {
    if (saving) return;

    const cleanedName = name.trim();
    if (!cleanedName) {
      toast.error('El nombre es obligatorio');
      return;
    }

    const payload = {
      name: cleanedName,
      total_amount: hasTransactions
        ? debt.total_amount
        : parseNumber(totalAmount),
      interest_rate: parseNumber(interestRate),
      due_date: dueDate ? toLocalYMD(dueDate) : null, // ← string "YYYY-MM-DD" o null
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
      toast.error(extractApiError(error));
    } finally {
      setSaving(false);
    }
  };

  // IDs accesibles
  const idName = 'edit-debt-name';
  const idAmount = 'edit-debt-total-amount';
  const idRate = 'edit-debt-interest-rate';
  const idCurrency = 'edit-debt-currency';

  // 🎨 Tintes neutros
  const panelTint = 'bg-[hsl(var(--accent))]';
  const headerTint = 'bg-[hsl(var(--muted))]';
  const ctaClass = 'bg-primary text-primary-foreground hover:bg-primary/90';

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent
        size='xl'
        className={cn(
          'grid grid-rows-[auto,1fr,auto] max-h-[92dvh]',
          'w-[min(100vw-1rem,560px)] rounded-2xl overflow-hidden',
          panelTint,
        )}
      >
        {/* HEADER tintado */}
        <header className={cn('border-b px-4 py-3', headerTint)}>
          <DialogTitle className='text-base sm:text-lg font-semibold'>
            Editar Deuda
          </DialogTitle>
        </header>

        {/* BODY (scroll) */}
        <section
          className='overflow-y-auto overscroll-contain px-4 py-4'
          aria-busy={saving}
        >
          <div className='space-y-4'>
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
                className='bg-white'
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
                className='bg-white'
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
                className='bg-white'
              />
            </div>

            {/* Fecha de vencimiento (DatePicker) */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium'>
                  Fecha de vencimiento
                </span>
                <InfoHint side='top'>Opcional. Solo referencia.</InfoHint>
              </div>
              <DatePicker
                value={dueDate}
                onChange={setDueDate}
                disabled={saving}
                className='z-[140]'
                buttonClassName='bg-white h-9'
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
                <SelectTrigger id={idCurrency} className='bg-white'>
                  <SelectValue placeholder='Selecciona la moneda' />
                </SelectTrigger>
                <SelectContent className='select-solid z-[140]'>
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
          </div>
        </section>

        {/* FOOTER tintado */}
        <footer className={cn('border-t px-4 py-3', headerTint)}>
          <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <DialogClose asChild>
              <Button
                className='bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 sm:min-w-[140px]'
                disabled={saving}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button
              onClick={handleUpdate}
              disabled={saving}
              aria-disabled={saving}
              className={cn('sm:min-w-[160px]', ctaClass)}
            >
              {saving ? 'Guardando…' : 'Actualizar Deuda'}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

/* Utils de fecha locales y seguras */
function toLocalYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function ymdToLocalDate(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
