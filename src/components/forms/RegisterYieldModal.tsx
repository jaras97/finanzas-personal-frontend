// components/forms/RegisterYieldModal.tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

  // Escala decimal por moneda: COP=0, USD/EUR=2
  const decimalScale = useMemo(
    () => (account?.currency === 'COP' ? 0 : 2),
    [account?.currency],
  );

  const handleRegisterYield = async () => {
    if (saving) return; // guard
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

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent
        className={cn(
          'w-[min(100vw-1rem,520px)]',
          'p-0',
          'bg-card text-foreground',
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => saving && e.preventDefault()}
        onEscapeKeyDown={(e) => saving && e.preventDefault()}
      >
        {/* Contenedor interno scrollable para mobile/teclado */}
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
              Registrar rendimiento en{' '}
              <span className='font-semibold'>{account.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-4 mt-2'>
            {/* Monto */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idAmount} className='text-sm font-medium'>
                  Monto del rendimiento ({account.currency})
                </label>
                <InfoHint side='top'>
                  Se registrará como <b>ingreso</b> y aumentará el saldo de la
                  cuenta.
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
              />
            </div>

            {/* Descripción */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idDesc} className='text-sm font-medium'>
                  Descripción
                </label>
                <InfoHint side='top'>
                  Opcional. Si lo dejas vacío usaremos{' '}
                  <b>“Rendimiento de inversión”</b>.
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
              onClick={handleRegisterYield}
              className='w-full'
              disabled={saving}
              aria-disabled={saving}
            >
              {saving ? 'Registrando…' : 'Registrar rendimiento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
