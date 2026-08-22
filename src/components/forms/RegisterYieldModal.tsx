// components/forms/RegisterYieldModal.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/lib/api';
import { SavingAccount } from '@/types';
import axios from 'axios';
import { NumericFormat } from 'react-number-format';
import InfoHint from '@/components/ui/info-hint';
import { cn } from '@/lib/utils';
import { useCurrencies } from '@/hooks/useCurrencies';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: SavingAccount;
  onCompleted: () => void;
}

export default function RegisterYieldModal({
  open,
  onOpenChange,
  account,
  onCompleted,
}: Props) {
  const [amount, setAmount] = useState(''); // UI
  const [amountNum, setAmountNum] = useState<number | undefined>(undefined); // número limpio
  const [description, setDescription] = useState('Rendimiento de inversión');
  const [saving, setSaving] = useState(false);

  const { currencies } = useCurrencies();
  const decimalScale = useMemo(
    () =>
      currencies.find((c) => c.code === account?.currency)?.decimal_digits ?? 2,
    [account?.currency, currencies],
  );

  const handleRegisterYield = async () => {
    if (saving) return;
    const amt = amountNum ?? NaN;

    if (isNaN(amt) || amt <= 0) {
      toast.error('Ingresa un monto válido (> 0)');
      return;
    }
    if (account.status !== 'active') {
      toast.error('No puedes registrar rendimiento en una cuenta cerrada.');
      return;
    }

    setSaving(true);
    try {
      await api.post(`/transactions/register-yield/${account.id}`, {
        amount: amt,
        description: (description || 'Rendimiento de inversión').trim(),
      });
      toast.success('Rendimiento registrado correctamente');
      onOpenChange(false);
      onCompleted();
      // Reset
      setAmount('');
      setAmountNum(undefined);
      setDescription('Rendimiento de inversión');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error?.response?.data?.detail || 'Error al registrar rendimiento',
        );
      } else {
        toast.error('Error inesperado al registrar rendimiento');
      }
    } finally {
      setSaving(false);
    }
  };

  // IDs accesibles
  const idAmount = 'yield-amount';
  const idDesc = 'yield-desc';

  // 🎨 Tinte “positivo” (ingreso)
  const panelTint = 'bg-emerald-50';
  const headerFooterTint = 'bg-emerald-100';
  const ctaClass =
    'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-300';

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent
        size='md'
        className={cn(
          'grid grid-rows-[auto,1fr,auto] max-h-[92dvh]',
          'w-[min(100vw-1rem,520px)] rounded-2xl overflow-hidden',
          panelTint,
        )}
      >
        {/* HEADER */}
        <header className={cn('border-b px-4 py-3', headerFooterTint)}>
          <DialogTitle className='flex items-center gap-2 text-base sm:text-lg font-semibold'>
            Registrar rendimiento en{' '}
            <span className='font-semibold'>{account.name}</span>
            <InfoHint side='top'>
              Se registra como <b>ingreso</b> y aumenta el saldo de la cuenta.
            </InfoHint>
          </DialogTitle>
        </header>

        {/* BODY (scroll) */}
        <section
          className='overflow-y-auto overscroll-contain px-4 py-4'
          aria-busy={saving}
        >
          <div className='space-y-4 mt-1'>
            {/* Monto */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idAmount} className='text-sm font-medium'>
                  Monto del rendimiento ({account.currency})
                </label>
                <InfoHint side='top'>
                  Usa{' '}
                  <b>{decimalScale === 0 ? 'enteros' : 'decimales'}</b>{' '}
                  según la moneda.
                </InfoHint>
              </div>
              <NumericFormat
                id={idAmount}
                value={amount}
                thousandSeparator
                decimalSeparator='.'
                decimalScale={decimalScale}
                allowNegative={false}
                inputMode='decimal'
                customInput={Input}
                disabled={saving}
                onValueChange={(values) => {
                  setAmount(values.value ?? '');
                  setAmountNum(values.floatValue);
                }}
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
                  Si lo dejas vacío usaremos <b>“Rendimiento de inversión”</b>.
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
        <footer className={cn('border-t', headerFooterTint)}>
          <div className='px-4 py-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <DialogClose asChild>
              <Button
                className='bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 sm:min-w-[140px]'
                disabled={saving}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button
              onClick={handleRegisterYield}
              disabled={saving}
              aria-disabled={saving}
              className={cn('sm:min-w-[200px]', ctaClass)}
            >
              {saving ? 'Registrando…' : 'Registrar rendimiento'}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
