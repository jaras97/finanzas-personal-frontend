'use client';

import { useState } from 'react';
import { DialogClose } from '@/components/ui/dialog';
import { FormModal } from '@/components/ui/form-modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';
import { SavingAccount } from '@/types';
import axios from 'axios';
import { formatCurrency } from '@/lib/format';
import { NumericFormat } from 'react-number-format';
import InfoHint from '@/components/ui/info-hint';

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

  const idAmount = 'deposit-amount';
  const idDesc = 'deposit-desc';

  // Nota: mantenemos 2 decimales (formato ES) según diseño de este modal
  const decimalScale = 2;

  return (
    <FormModal
      open={open}
      onOpenChange={(o) => !saving && onOpenChange(o)}
      size='md'
      className='w-[min(100vw-1rem,520px)]'
      tone='emerald'
      title={
        <>
          Depositar en {account.name} ({account.currency})
          <InfoHint side='top'>
            Este movimiento se registrará como un <b>ingreso</b> en la cuenta.
            Si te equivocas, puedes compensarlo creando un <b>retiro</b>.
          </InfoHint>
        </>
      }
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
            onClick={handleDeposit}
            disabled={saving}
            aria-disabled={saving}
            className='bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-300 sm:min-w-[160px]'
          >
            {saving ? 'Depositando…' : 'Depositar'}
          </Button>
        </>
      }
    >
      <div className='space-y-4' aria-busy={saving}>
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
    </FormModal>
  );
}
