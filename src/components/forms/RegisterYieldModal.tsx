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
  const decimalScale = useMemo(() => {
    return account?.currency === 'COP' ? 0 : 2;
  }, [account?.currency]);

  const handleRegisterYield = async () => {
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

  const idAmount = 'yield-amount';
  const idDesc = 'yield-desc';

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className='bg-card text-foreground'>
        <DialogHeader>
          <DialogTitle>
            Registrar rendimiento en{' '}
            <span className='font-semibold'>{account.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Monto */}
          <div className='space-y-1'>
            <label htmlFor={idAmount} className='text-sm font-medium'>
              Monto del rendimiento ({account.currency})
            </label>
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
            <p className='text-xs text-muted-foreground'>
              Se registrará como <b>ingreso</b> y aumentará el saldo de la
              cuenta.
            </p>
          </div>

          {/* Descripción */}
          <div className='space-y-1'>
            <label htmlFor={idDesc} className='text-sm font-medium'>
              Descripción{' '}
              <span className='font-normal text-muted-foreground'>
                (opcional)
              </span>
            </label>
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
          >
            {saving ? 'Registrando…' : 'Registrar rendimiento'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
