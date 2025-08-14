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
    if (saving) return; // evita dobles envíos
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
      <DialogContent
        className={cn(
          'bg-card text-foreground',
          'w-[min(100vw-1rem,520px)]',
          'p-0',
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => saving && e.preventDefault()}
        onEscapeKeyDown={(e) => saving && e.preventDefault()}
      >
        {/* Contenedor scrollable para mobile/teclado */}
        <div
          className={cn(
            'max-h-[85dvh] sm:max-h-[80vh]',
            'overflow-y-auto overscroll-contain',
            'px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]',
          )}
          aria-busy={saving}
        >
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              Depositar en {account.name} ({account.currency})
              <InfoHint side='top'>
                Este movimiento se registrará como un <b>ingreso</b> en la
                cuenta. No puedes deshacerlo, pero sí revertirlo creando un
                retiro equivalente si te equivocaste.
              </InfoHint>
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
                decimalScale={2}
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
                  <span className='font-normal text-muted-foreground'>
                    &nbsp;(opcional)
                  </span>
                </label>
                <InfoHint side='top'>
                  Añade un detalle como “Pago de nómina” o “Transferencia desde
                  X cuenta” para reconocerlo después.
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
              onClick={handleDeposit}
              className='w-full'
              disabled={saving}
              aria-disabled={saving}
            >
              {saving ? 'Depositando…' : 'Depositar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
