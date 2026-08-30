'use client';

import { useState, useMemo } from 'react';
import { FormModal } from '@/components/ui/form-modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Debt } from '@/types';
import axios from 'axios';
import { formatCurrency } from '@/lib/format';
import { toIsoAtLocalNoon } from '@/utils/dates';
import { NumericFormat } from 'react-number-format';
import InfoHint from '@/components/ui/info-hint';
import { DatePicker } from '@/components/ui/date-picker';
import { useCurrencies } from '@/hooks/useCurrencies';

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
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const isClosed = useMemo(() => debt.status === 'closed', [debt.status]);
  const { currencies } = useCurrencies();
  const amountDecimalScale =
    currencies.find((c) => c.code === debt.currency)?.decimal_digits ?? 2;

  const parseNumber = (v: string) => {
    const n = parseFloat((v || '').replace(',', '.'));
    return isNaN(n) ? NaN : n;
  };

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

  const handleAddCharge = async () => {
    if (saving) return;
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
        // la API espera "YYYY-MM-DD" → toIsoAtLocalNoon(ymd)
        date: date ? toIsoAtLocalNoon(toLocalYMD(date)) : undefined,
      });
      toast.success('Cargo agregado correctamente');
      onCompleted();
      onOpenChange(false);
      setAmount('');
      setDescription('');
      setDate(undefined);
    } catch (error) {
      toast.error(extractApiError(error));
    } finally {
      setSaving(false);
    }
  };

  // IDs (para labels)
  const idAmount = 'add-charge-amount';
  const idDesc = 'add-charge-desc';

  return (
    <FormModal
      open={open}
      onOpenChange={(o) => !saving && onOpenChange(o)}
      className='w-[min(100vw-1rem,520px)]'
      title={`Agregar cargo a ${debt.name}`}
    >
      <div className='space-y-4' aria-busy={saving}>
            <div className='text-xs text-muted-foreground'>
              Saldo actual:{' '}
              <b>
                {formatCurrency(debt.total_amount)} {debt.currency}
              </b>
            </div>

            {/* Fecha (DatePicker) */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium'>Fecha del cargo</span>
                <InfoHint side='top'>
                  Opcional. Se guarda a <b>mediodía local</b> para evitar
                  cambios de día por husos horarios.
                </InfoHint>
              </div>
              <DatePicker
                value={date}
                onChange={setDate}
                disabled={saving}
                className='z-[140]'
                buttonClassName='bg-white h-9'
              />
            </div>

            {/* Monto */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idAmount} className='text-sm font-medium'>
                  Monto del cargo ({debt.currency})
                </label>
                <InfoHint side='top'>
                  Debe ser mayor que <b>0</b>. Este cargo aumentará el saldo de
                  la deuda.
                </InfoHint>
              </div>

              <NumericFormat
                id={idAmount}
                value={amount}
                onValueChange={({ value }) => setAmount(value)}
                thousandSeparator='.'
                decimalSeparator=','
                allowNegative={false}
                decimalScale={amountDecimalScale}
                inputMode='decimal'
                customInput={Input}
                disabled={saving}
                className='bg-white'
              />
            </div>

            {/* Descripción */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idDesc} className='text-sm font-medium'>
                  Descripción
                </label>
                <InfoHint side='top'>
                  Opcional. Ayuda a identificar el <b>motivo</b> del cargo. Este
                  movimiento no afecta cuentas hasta que realices un pago.
                </InfoHint>
              </div>
              <Input
                id={idDesc}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
                className='bg-white'
              />
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
              aria-disabled={saving || isClosed}
            >
              {saving ? 'Agregando…' : 'Agregar Cargo'}
            </Button>
      </div>
    </FormModal>
  );
}

/* Util local: Date → 'YYYY-MM-DD' (zona local, sin TZ) */
function toLocalYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
