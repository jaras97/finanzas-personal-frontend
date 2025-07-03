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
import { Debt, SavingAccount } from '@/types';
import { useSavingAccounts } from '@/hooks/useSavingAccounts';
import { formatCurrency } from '@/lib/format';

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

  const handlePay = async () => {
    if (!amount || !savingAccountId) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    try {
      await api.post(`/debts/${debt.id}/pay`, {
        amount: parseFloat(amount),
        saving_account_id: parseInt(savingAccountId),
        description: description || `Pago de deuda: ${debt.name}`,
        date: date ? new Date(date).toISOString() : undefined,
      });
      toast.success('Deuda pagada correctamente');
      onPaid();
      onOpenChange(false);
      setAmount('');
      setSavingAccountId('');
      setDescription('');
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Error al pagar la deuda');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Pagar deuda: {debt.name} ({debt.currency})
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-2'>
          <Input
            placeholder='Fecha de pago (opcional)'
            type='date'
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            placeholder={`Monto a pagar (${debt.currency})`}
            type='number'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <select
            value={savingAccountId}
            onChange={(e) => setSavingAccountId(e.target.value)}
            className='w-full border rounded p-2'
          >
            <option value=''>Selecciona la cuenta de pago</option>
            {accounts
              .filter((acc) => acc.currency === debt.currency)
              .map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} - Saldo: {formatCurrency(acc.balance)}{' '}
                  {acc.currency}
                </option>
              ))}
          </select>
          <Input
            placeholder='Descripción (opcional)'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Button onClick={handlePay}>Pagar deuda</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
