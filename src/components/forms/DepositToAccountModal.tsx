'use client';

import { useState } from 'react';
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
import { SavingAccount } from '@/types';
import axios from 'axios';
import { formatCurrency } from '@/lib/format';
import { NumericFormat } from 'react-number-format';

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

  // IDs accesibles
  const idAmount = 'deposit-amount';
  const idDesc = 'deposit-desc';

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className='bg-card text-foreground'>
        <DialogHeader>
          <DialogTitle>
            Depositar en {account.name} ({account.currency})
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <p className='text-xs text-muted-foreground'>
            Saldo actual:{' '}
            <b>
              {formatCurrency(account.balance)} {account.currency}
            </b>
          </p>

          {/* Monto */}
          <div className='space-y-1'>
            <label htmlFor={idAmount} className='text-sm font-medium'>
              Monto ({account.currency})
            </label>

            <NumericFormat
              id={idAmount}
              value={amount}
              onValueChange={({ value }) => setAmount(value)} // guarda el valor crudo (sin separadores, con punto decimal)
              thousandSeparator='.'
              decimalSeparator=','
              allowNegative={false}
              decimalScale={2}
              inputMode='decimal'
              customInput={Input} // usa tu mismo componente Input para conservar estilos
              disabled={saving}
            />
            <p className='text-xs text-muted-foreground'>
              Este depósito se reflejará como un <b>ingreso</b> en los
              movimientos de la cuenta.
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

          <Button onClick={handleDeposit} className='w-full' disabled={saving}>
            {saving ? 'Depositando…' : 'Depositar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
