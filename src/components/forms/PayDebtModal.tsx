'use client';

import { useMemo, useState } from 'react';
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
import { Debt, SavingAccount as SavingAccountType } from '@/types';
import { useSavingAccounts } from '@/hooks/useSavingAccounts';
import { formatCurrency } from '@/lib/format';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import axios from 'axios';
import { toIsoAtLocalNoon } from '@/utils/dates';
import { NumericFormat } from 'react-number-format';
import InfoHint from '@/components/ui/info-hint';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: Debt;
  onPaid: () => void;
}

export default function PayDebtModal({
  open,
  onOpenChange,
  debt,
  onPaid,
}: Props) {
  const { accounts } = useSavingAccounts();

  const [amount, setAmount] = useState('');
  const [savingAccountId, setSavingAccountId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);

  const parseNumber = (v: string) => {
    const n = parseFloat((v || '').replace(',', '.'));
    return isNaN(n) ? NaN : n;
  };

  // Escala decimal por moneda (COP→0, USD/EUR→2)
  const amountDecimalScale = debt.currency === 'COP' ? 0 : 2;

  // ✅ Solo cuentas ACTIVAS y en la MISMA MONEDA que la deuda
  const eligibleAccounts = useMemo(
    () =>
      (accounts as SavingAccountType[])
        .filter(
          (acc) => acc.status === 'active' && acc.currency === debt.currency,
        )
        .sort((a, b) => b.balance - a.balance),
    [accounts, debt.currency],
  );

  const selectedAccount = useMemo(
    () =>
      eligibleAccounts.find((a) => a.id.toString() === savingAccountId) ||
      undefined,
    [eligibleAccounts, savingAccountId],
  );

  const idDate = 'pay-debt-date';
  const idAmount = 'pay-debt-amount';
  const idAccount = 'pay-debt-account';
  const idDesc = 'pay-debt-desc';

  const handleFillMax = () => {
    if (!selectedAccount) return;
    const maxPay = Math.min(debt.total_amount, selectedAccount.balance);
    setAmount(String(maxPay)); // NumericFormat recibe el valor crudo
  };

  const handlePay = async () => {
    if (saving) return;

    const amt = parseNumber(amount);

    if (amt > debt.total_amount) {
      toast.error(
        `El monto excede el saldo pendiente (${debt.currency} ${debt.total_amount}).`,
      );
      return;
    }
    if (!savingAccountId) {
      toast.error('Selecciona la cuenta de pago');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      toast.error('Ingresa un monto válido (> 0)');
      return;
    }
    if (!selectedAccount) {
      toast.error('La cuenta seleccionada no es válida');
      return;
    }
    if (amt > selectedAccount.balance) {
      toast.error('Saldo insuficiente en la cuenta seleccionada');
      return;
    }

    setSaving(true);
    try {
      await api.post(`/debts/${debt.id}/pay`, {
        amount: amt,
        saving_account_id: parseInt(savingAccountId, 10),
        description: description || `Pago de deuda: ${debt.name}`,
        date: date ? toIsoAtLocalNoon(date) : undefined, // ⬅️ mediodía local
      });

      toast.success('Deuda pagada correctamente');
      onPaid();
      onOpenChange(false);

      // Reset
      setAmount('');
      setSavingAccountId('');
      setDescription('');
      setDate('');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error?.response?.data?.detail || 'Error al pagar la deuda');
      } else {
        toast.error('Error inesperado al pagar la deuda');
      }
    } finally {
      setSaving(false);
    }
  };

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
            <DialogTitle>
              Pagar deuda: {debt.name} ({debt.currency})
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            {/* Fecha */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idDate} className='text-sm font-medium'>
                  Fecha de pago
                </label>
                <InfoHint side='top'>
                  Opcional. Se guarda a <b>mediodía local</b> para evitar saltos
                  de día por husos horarios.
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
                  Monto a pagar ({debt.currency})
                </label>
                <InfoHint side='top'>
                  No puedes pagar más del <b>saldo pendiente</b>. Usa “Pagar
                  total” para autocompletar.
                </InfoHint>
              </div>
              <div className='flex gap-2'>
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
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleFillMax}
                  disabled={saving || !selectedAccount}
                >
                  Pagar total
                </Button>
              </div>
              <div className='text-xs text-muted-foreground'>
                Saldo pendiente:{' '}
                <b>
                  {formatCurrency(debt.total_amount)} {debt.currency}
                </b>
              </div>
            </div>

            {/* Cuenta de pago */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idAccount} className='text-sm font-medium'>
                  Cuenta de pago
                </label>
                <InfoHint side='top'>
                  Solo se listan cuentas <b>activas</b> en{' '}
                  <b>{debt.currency}</b>. Si no aparece, créala o actívala.
                </InfoHint>
              </div>
              <Select
                value={savingAccountId}
                onValueChange={setSavingAccountId}
                disabled={saving || eligibleAccounts.length === 0}
              >
                <SelectTrigger id={idAccount}>
                  <SelectValue
                    placeholder={
                      eligibleAccounts.length
                        ? 'Selecciona la cuenta'
                        : 'No hay cuentas disponibles'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {eligibleAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id.toString()}>
                      ({formatCurrency(acc.balance)} {acc.currency}) {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {eligibleAccounts.length === 0 && (
                <p className='text-xs text-amber-600'>
                  No tienes cuentas activas en {debt.currency}. Crea una para
                  poder pagar esta deuda.
                </p>
              )}

              {selectedAccount && (
                <p className='text-xs'>
                  Disponible:{' '}
                  <b>
                    {formatCurrency(selectedAccount.balance)}{' '}
                    {selectedAccount.currency}
                  </b>
                </p>
              )}
            </div>

            {/* Descripción */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idDesc} className='text-sm font-medium'>
                  Descripción
                </label>
                <InfoHint side='top'>
                  Opcional. Aparecerá como nota en la transacción de pago.
                </InfoHint>
              </div>
              <Input
                id={idDesc}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
              />
            </div>

            <Button
              onClick={handlePay}
              className='w-full'
              disabled={saving || eligibleAccounts.length === 0}
              aria-disabled={saving || eligibleAccounts.length === 0}
            >
              {saving ? 'Pagando…' : 'Pagar deuda'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
