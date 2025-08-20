'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
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
import { NumericFormat } from 'react-number-format';
import InfoHint from '@/components/ui/info-hint';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: Debt;
  onPaid: () => void;
}

// Helper: ISO a mediodía local desde Date
const dateToIsoAtLocalNoon = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).toISOString();

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
  const [date, setDate] = useState<Date | undefined>(undefined);
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

  const idAmount = 'pay-debt-amount';
  const idAccount = 'pay-debt-account';
  const idDesc = 'pay-debt-desc';

  const handleFillMax = () => {
    if (!selectedAccount) return;
    const maxPay = Math.min(debt.total_amount, selectedAccount.balance);
    setAmount(String(maxPay)); // NumericFormat espera valor crudo
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
        date: date ? dateToIsoAtLocalNoon(date) : undefined, // ⬅️ mediodía local
      });

      toast.success('Deuda pagada correctamente');
      onPaid();
      onOpenChange(false);

      // Reset
      setAmount('');
      setSavingAccountId('');
      setDescription('');
      setDate(undefined);
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

  // 🎨 Tintes del panel (neutro)
  const panelTint = 'bg-[hsl(var(--accent))]';
  const headerTint = 'bg-[hsl(var(--muted))]';
  const ctaClass = 'bg-primary text-primary-foreground hover:bg-primary/90';

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent
        size='xl'
        className={cn(
          // layout header | body | footer
          'grid grid-rows-[auto,1fr,auto] max-h-[92dvh]',
          'w-[min(100vw-1rem,560px)] rounded-2xl overflow-hidden',
          panelTint,
        )}
      >
        {/* HEADER */}
        <header className={cn('border-b px-4 py-3', headerTint)}>
          <DialogTitle className='text-base sm:text-lg font-semibold'>
            Pagar deuda: {debt.name} ({debt.currency})
          </DialogTitle>
        </header>

        {/* BODY (scroll) */}
        <section
          className='overflow-y-auto overscroll-contain px-4 py-4'
          aria-busy={saving}
        >
          <div className='space-y-4'>
            {/* Fecha */}
            <div className='space-y-1'>
              <div className='flex items-center justify-between gap-2'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium'>Fecha de pago</span>
                  <InfoHint side='top'>
                    Opcional. Se guarda a <b>mediodía local</b> para evitar
                    saltos de día por husos horarios.
                  </InfoHint>
                </div>
                {/* Accesos rápidos ya vienen en el Popover (Limpiar/Hoy) */}
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
                  className='bg-white'
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
                <SelectTrigger id={idAccount} className='bg-white'>
                  <SelectValue
                    placeholder={
                      eligibleAccounts.length
                        ? 'Selecciona la cuenta'
                        : 'No hay cuentas disponibles'
                    }
                  />
                </SelectTrigger>
                <SelectContent className='select-solid z-[140]'>
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
                className='bg-white'
              />
            </div>
          </div>
        </section>

        {/* FOOTER */}
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
              onClick={handlePay}
              disabled={saving || eligibleAccounts.length === 0}
              aria-disabled={saving || eligibleAccounts.length === 0}
              className={cn('sm:min-w-[160px]', ctaClass)}
            >
              {saving ? 'Pagando…' : 'Pagar deuda'}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
