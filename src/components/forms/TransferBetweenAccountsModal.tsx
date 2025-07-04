'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';
import { SavingAccount } from '@/types';
import { formatCurrency } from '@/lib/format';
import axios from 'axios';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: SavingAccount[];
  onTransferred: () => void;
}

export default function TransferBetweenAccountsModal({
  open,
  onOpenChange,
  accounts,
  onTransferred,
}: Props) {
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState('');
  const [description, setDescription] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');

  const fromAccount = accounts.find((a) => a.id.toString() === fromAccountId);
  const toAccount = accounts.find((a) => a.id.toString() === toAccountId);
  const amountNumber = parseFloat(amount);
  const rateNumber = parseFloat(exchangeRate);

  const requiresConversion =
    fromAccount && toAccount && fromAccount.currency !== toAccount.currency;

  const convertedAmount =
    requiresConversion &&
    !isNaN(amountNumber) &&
    !isNaN(rateNumber) &&
    amountNumber > 0 &&
    rateNumber > 0
      ? amountNumber * rateNumber
      : null;

  const handleTransfer = async () => {
    if (!fromAccountId || !toAccountId || !amount) {
      toast.error('Completa todos los campos requeridos');
      return;
    }
    if (requiresConversion && (!exchangeRate || rateNumber <= 0)) {
      toast.error('Ingresa una tasa de conversión válida');
      return;
    }

    try {
      await api.post('/transactions/transfer', {
        from_account_id: parseInt(fromAccountId),
        to_account_id: parseInt(toAccountId),
        amount: amountNumber,
        transaction_fee: fee ? parseFloat(fee) : 0,
        description: description || undefined,
        exchange_rate: requiresConversion ? rateNumber : undefined,
      });
      toast.success('Transferencia realizada correctamente');
      onTransferred();
      onOpenChange(false);
      setFromAccountId('');
      setToAccountId('');
      setAmount('');
      setFee('');
      setDescription('');
      setExchangeRate('');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error?.response?.data?.detail || 'Error al realizar transferencia',
        );
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='bg-card text-foreground'>
        <DialogHeader>
          <DialogTitle>Transferir entre cuentas</DialogTitle>
        </DialogHeader>

        <div className='space-y-3 text-sm text-muted-foreground'>
          {requiresConversion ? (
            <p>
              Ingresarás el <strong>monto en {fromAccount?.currency}</strong> y
              la <strong>tasa de conversión</strong> indica cuántas unidades de{' '}
              {toAccount?.currency} se obtienen por 1 unidad de{' '}
              {fromAccount?.currency}.
            </p>
          ) : (
            <p>
              El monto se ingresará en la moneda de la cuenta origen (
              {fromAccount?.currency ?? '---'}).
            </p>
          )}

          <Select value={fromAccountId} onValueChange={setFromAccountId}>
            <SelectTrigger>
              <SelectValue placeholder='Cuenta origen' />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id.toString()}>
                  {account.name} ({account.currency})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={toAccountId} onValueChange={setToAccountId}>
            <SelectTrigger>
              <SelectValue placeholder='Cuenta destino' />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id.toString()}>
                  {account.name} ({account.currency})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder={`Monto en ${fromAccount?.currency ?? 'moneda origen'}`}
            type='number'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Input
            placeholder='Comisión (opcional)'
            type='number'
            value={fee}
            onChange={(e) => setFee(e.target.value)}
          />

          <Input
            placeholder='Descripción (opcional)'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {requiresConversion && (
            <>
              <Input
                placeholder={`Tasa de conversión a ${
                  toAccount?.currency ?? 'destino'
                }`}
                type='number'
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
              />
              {convertedAmount !== null && (
                <p className='text-sm text-muted-foreground'>
                  Se depositarán:{' '}
                  <strong>
                    {formatCurrency(convertedAmount)} {toAccount?.currency}
                  </strong>
                </p>
              )}
            </>
          )}

          <Button onClick={handleTransfer} className='w-full'>
            Transferir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
