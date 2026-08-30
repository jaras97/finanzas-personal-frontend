'use client';

import { useState } from 'react';
import { DialogClose } from '@/components/ui/dialog';
import { FormModal } from '@/components/ui/form-modal';
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
import { DatePicker } from '@/components/ui/date-picker';
import { currencyType } from '@/types';
import { useCurrencies } from '@/hooks/useCurrencies';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function NewDebtModal({ open, onOpenChange, onCreated }: Props) {
  const [name, setName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [interestRate, setInterestRate] = useState(''); // opcional
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined); // ← ahora Date
  const [currency, setCurrency] = useState<currencyType>('COP');
  const [kind, setKind] = useState<'loan' | 'credit_card'>('loan');
  const [creditLimit, setCreditLimit] = useState('');
  const [statementDay, setStatementDay] = useState('');
  const [paymentDueDays, setPaymentDueDays] = useState('');
  const [minPaymentPercent, setMinPaymentPercent] = useState('');
  const { currencies } = useCurrencies();
  const [saving, setSaving] = useState(false);

  const parseNumber = (v: string) => {
    const n = parseFloat((v || '').replace(',', '.'));
    return isNaN(n) ? NaN : n;
  };

  // Date → "YYYY-MM-DD" (local) para compatibilidad backend
  const toLocalYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const resetForm = () => {
    setName('');
    setTotalAmount('');
    setInterestRate('');
    setDueDate(undefined);
    setCurrency('COP');
    setKind('loan');
    setCreditLimit('');
    setStatementDay('');
    setPaymentDueDays('');
    setMinPaymentPercent('');
  };

  // Evita pasar objetos al toast cuando el backend responde 422
  function extractApiError(err: unknown): string {
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
  }

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

    if (kind === 'credit_card' && statementDay) {
      const day = parseInt(statementDay, 10);
      if (isNaN(day) || day < 1 || day > 28) {
        toast.error('El día de corte debe estar entre 1 y 28');
        return;
      }
    }

    const payload = {
      name: cleanedName,
      total_amount: amount,
      interest_rate: rate, // informativo
      due_date: dueDate ? toLocalYMD(dueDate) : null, // ← string o null
      currency,
      kind,
      ...(kind === 'credit_card' && {
        credit_limit: creditLimit ? parseNumber(creditLimit) : null,
        statement_day: statementDay ? parseInt(statementDay, 10) : null,
        payment_due_days: paymentDueDays ? parseInt(paymentDueDays, 10) : null,
        minimum_payment_percent: minPaymentPercent ? parseNumber(minPaymentPercent) : null,
      }),
    };

    setSaving(true);
    try {
      await api.post('/debts', payload);
      toast.success('Deuda creada correctamente');
      onCreated();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error(extractApiError(error));
    } finally {
      setSaving(false);
    }
  };

  // IDs accesibles
  const idName = 'new-debt-name';
  const idAmount = 'new-debt-amount';
  const idRate = 'new-debt-rate';
  const idCurr = 'new-debt-currency';
  const idKind = 'new-debt-kind';

  return (
    <FormModal
      open={open}
      onOpenChange={(o) => !saving && onOpenChange(o)}
      className='w-[min(100vw-1rem,560px)]'
      title='Nueva Deuda'
      footer={
        <>
          <DialogClose asChild>
            <Button
              className='bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 sm:min-w-[140px]'
              disabled={saving}
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            aria-disabled={saving}
            className='sm:min-w-[160px]'
          >
            {saving ? 'Creando…' : 'Crear Deuda'}
          </Button>
        </>
      }
    >
      <div className='space-y-4' aria-busy={saving}>
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
                className='bg-white'
              />
            </div>

            {/* Tasa de interés (opcional) */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idRate} className='text-sm font-medium'>
                  Tasa de interés (%)
                </label>
                <InfoHint side='top'>
                  Campo <b>opcional</b> e <b>informativo</b>. No calcula
                  intereses automáticos. Para cargos/recargos usa{' '}
                  <b>Agregar Cargo</b>.
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

            {/* Fecha de vencimiento (con DatePicker) */}
            <div className='space-y-1'>
              <div className='flex items-center justify-between gap-2'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium'>
                    Fecha de vencimiento
                  </span>
                  <InfoHint side='top'>
                    Opcional. Úsala como referencia/recordatorio.
                  </InfoHint>
                </div>
                {/* Limpiar/Hoy ya vienen en el Popover del DatePicker */}
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
                <label htmlFor={idCurr} className='text-sm font-medium'>
                  Moneda
                </label>
                <InfoHint side='top'>
                  Determina qué cuentas podrás usar al pagar esta deuda.
                </InfoHint>
              </div>
              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v as currencyType)}
                disabled={saving}
              >
                <SelectTrigger id={idCurr} className='bg-white'>
                  <SelectValue placeholder='Selecciona la moneda' />
                </SelectTrigger>
                <SelectContent className='select-solid z-[140]'>
                  {currencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
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
                <SelectTrigger id={idKind} className='bg-white'>
                  <SelectValue placeholder='Selecciona el tipo' />
                </SelectTrigger>
                <SelectContent className='select-solid z-[140]'>
                  <SelectItem value='loan'>Préstamo</SelectItem>
                  <SelectItem value='credit_card'>
                    Tarjeta de Crédito
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ciclo de facturación (solo tarjetas) */}
            {kind === 'credit_card' && (
              <div className='space-y-4 rounded-lg border border-slate-200 p-3'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium'>
                    Ciclo de facturación (opcional)
                  </span>
                  <InfoHint side='top'>
                    Completa esto para ver cupo disponible, fecha de pago y pago mínimo
                    estimado. Puedes dejarlo en blanco y configurarlo después editando la
                    tarjeta.
                  </InfoHint>
                </div>

                <div className='space-y-1'>
                  <label className='text-sm font-medium'>Cupo total</label>
                  <NumericFormat
                    value={creditLimit}
                    onValueChange={({ value }) => setCreditLimit(value)}
                    thousandSeparator='.'
                    decimalSeparator=','
                    allowNegative={false}
                    decimalScale={2}
                    inputMode='decimal'
                    customInput={Input}
                    disabled={saving}
                    className='bg-white'
                  />
                </div>

                <div className='grid grid-cols-2 gap-3'>
                  <div className='space-y-1'>
                    <label className='text-sm font-medium'>Día de corte (1-28)</label>
                    <Input
                      type='number'
                      min={1}
                      max={28}
                      value={statementDay}
                      onChange={(e) => setStatementDay(e.target.value)}
                      disabled={saving}
                      className='bg-white'
                    />
                  </div>
                  <div className='space-y-1'>
                    <label className='text-sm font-medium'>Días para pagar</label>
                    <Input
                      type='number'
                      min={1}
                      value={paymentDueDays}
                      onChange={(e) => setPaymentDueDays(e.target.value)}
                      disabled={saving}
                      className='bg-white'
                    />
                  </div>
                </div>

                <div className='space-y-1'>
                  <label className='text-sm font-medium'>Pago mínimo (% del saldo)</label>
                  <NumericFormat
                    value={minPaymentPercent}
                    onValueChange={({ value }) => setMinPaymentPercent(value)}
                    decimalSeparator=','
                    allowNegative={false}
                    decimalScale={2}
                    inputMode='decimal'
                    customInput={Input}
                    disabled={saving}
                    className='bg-white'
                  />
                </div>
              </div>
            )}
      </div>
    </FormModal>
  );
}
