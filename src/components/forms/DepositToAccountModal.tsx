'use client';

import { useState } from 'react';
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
import { SavingAccount } from '@/types';
import axios from 'axios';
import { formatCurrency } from '@/lib/format';
import { NumericFormat } from 'react-number-format';
import InfoHint from '@/components/ui/info-hint';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: SavingAccount;
  onCompleted: () => void;
}

export default function DepositToAccountModal({
  open,
  onOpenChange,
  account,
  onCompleted,
}: Props) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const parseNumber = (v: string) => {
    const n = parseFloat((v || '').replace(',', '.'));
    return isNaN(n) ? NaN : n;
  };

  const handleDeposit = async () => {
    if (saving) return;
    const amt = parseNumber(amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Ingresa un monto válido (> 0)');
      return;
    }

    setSaving(true);
    try {
      await api.post(`/saving-accounts/${account.id}/deposit`, {
        amount: amt,
        description: description?.trim() || undefined,
      });
      toast.success('Depósito realizado correctamente');
      onOpenChange(false);
      onCompleted();
      setAmount('');
      setDescription('');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error?.response?.data?.detail || 'Error al realizar depósito',
        );
      } else {
        toast.error('Error inesperado al realizar depósito');
      }
    } finally {
      setSaving(false);
    }
  };

  // 🎨 Tinte positivo
  const panelTint = 'bg-emerald-50';
  const headerFooterTint = 'bg-emerald-100';
  const ctaClass =
    'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-300';

  const idAmount = 'deposit-amount';
  const idDesc = 'deposit-desc';

  // Nota: mantenemos 2 decimales (formato ES) según diseño de este modal
  const decimalScale = 2;

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent
        className={cn(
          'grid grid-rows-[auto,1fr,auto] max-h-[92dvh]',
          'w-[min(100vw-1rem,520px)] rounded-2xl overflow-hidden',
          panelTint,
        )}
        size='md'
      >
        {/* HEADER */}
        <header className={cn('border-b px-4 py-3', headerFooterTint)}>
          <DialogTitle className='flex items-center gap-2 text-base sm:text-lg font-semibold'>
            Depositar en {account.name} ({account.currency})
            <InfoHint side='top'>
              Este movimiento se registrará como un <b>ingreso</b> en la cuenta.
              Si te equivocas, puedes compensarlo creando un <b>retiro</b>.
            </InfoHint>
          </DialogTitle>
        </header>

        {/* BODY */}
        <section
          className='overflow-y-auto overscroll-contain px-4 py-4'
          aria-busy={saving}
        >
          <div className='space-y-4'>
            <p className='text-xs text-muted-foreground'>
              Saldo actual:{' '}
              <b>
                {formatCurrency(account.balance)} {account.currency}
              </b>
            </p>

            {/* Monto */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idAmount} className='text-sm font-medium'>
                  Monto ({account.currency})
                </label>
                <InfoHint side='top'>
                  Usa <b>coma</b> como separador decimal y <b>punto</b> para
                  miles (ej: 1.234,56). No se permiten valores negativos.
                </InfoHint>
              </div>
              <NumericFormat
                id={idAmount}
                value={amount}
                onValueChange={({ value }) => setAmount(value)} // valor crudo "1234.56"
                thousandSeparator='.'
                decimalSeparator=','
                allowNegative={false}
                decimalScale={decimalScale}
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
                  <span className='font-normal text-muted-foreground'>
                    &nbsp;(opcional)
                  </span>
                </label>
                <InfoHint side='top'>
                  Añade un detalle como “Pago de nómina” o “Transferencia desde
                  X cuenta”.
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
              onClick={handleDeposit}
              disabled={saving}
              aria-disabled={saving}
              className={cn('sm:min-w-[160px]', ctaClass)}
            >
              {saving ? 'Depositando…' : 'Depositar'}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
