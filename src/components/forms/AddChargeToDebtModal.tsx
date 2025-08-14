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
import InfoHint from '@/components/ui/info-hint';
import { cn } from '@/lib/utils';

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
  const amountDecimalScale = debt.currency === 'COP' ? 0 : 2;

  const parseNumber = (v: string) => {
    const n = parseFloat((v || '').replace(',', '.'));
    return isNaN(n) ? NaN : n;
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
            <DialogTitle>Agregar cargo a {debt.name}</DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='text-xs text-muted-foreground'>
              Saldo actual:{' '}
              <b>
                {formatCurrency(debt.total_amount)} {debt.currency}
              </b>
            </div>

            {/* Fecha */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idDate} className='text-sm font-medium'>
                  Fecha del cargo
                </label>
                <InfoHint side='top'>
                  Opcional. Se guarda a <b>mediodía local</b> para evitar
                  cambios de día por husos horarios.
                </InfoHint>
              </div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
