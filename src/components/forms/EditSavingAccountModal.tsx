'use client';

import { useState, useEffect } from 'react';
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
import { Account, SavingAccount } from '@/types';
import { formatCurrency } from '@/lib/format';
import axios from 'axios';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: SavingAccount;
  onUpdated: () => void;
}

export default function EditSavingAccountModal({
  open,
  onOpenChange,
  account,
  onUpdated,
}: Props) {
  const [name, setName] = useState(account.name);
  const [type, setType] = useState<Account>(account.type || '');
  const [hasTransactions, setHasTransactions] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cargar estado inicial
  useEffect(() => {
    if (account?.id) {
      setName(account.name);
      setType(account.type || '');
      checkIfHasTransactions(account.id);
    }
  }, [account]);

  const checkIfHasTransactions = async (accountId: number) => {
    try {
      const response = await api.get(
        `/saving-accounts/${accountId}/has-transactions`,
      );
      setHasTransactions(response.data.hasTransactions);
    } catch (error) {
      console.error('Error verificando transacciones:', error);
      toast.error('Error al verificar si la cuenta tiene transacciones.');
    }
  };

  const handleUpdate = async () => {
    if (!name) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setLoading(true);
    try {
      await api.put(`/saving-accounts/${account.id}`, {
        name,
        type: type || 'general',
      });
      toast.success('Cuenta actualizada correctamente');
      onOpenChange(false);
      onUpdated();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error?.response?.data?.detail || 'Error al actualizar cuenta',
        );
      } else {
        toast.error('Error inesperado al actualizar cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

  const accountTypeOptions: { value: Account; label: string }[] = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'bank', label: 'Bancaria' },
    { value: 'investment', label: 'Inversión' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='bg-card text-foreground'>
        <DialogHeader>
          <DialogTitle>Editar cuenta de ahorro</DialogTitle>
        </DialogHeader>
        <div className='space-y-3'>
          <Input
            placeholder='Nombre de la cuenta'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder='Saldo actual'
            value={formatCurrency(account.balance) + ' ' + account.currency}
            disabled
          />
          <p className='text-sm text-muted-foreground'>
            El saldo no puede editarse manualmente. Para modificarlo, realiza
            depósitos o retiros desde la cuenta.
          </p>

          {!hasTransactions ? (
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Account)}
              className='w-full border rounded-md px-3 py-2 text-sm'
            >
              <option value=''>Selecciona un tipo</option>
              {accountTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <p className='text-sm text-muted-foreground'>
              El tipo de cuenta no puede modificarse porque tiene transacciones
              asociadas.
            </p>
          )}

          <Button onClick={handleUpdate} className='w-full' disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar cuenta'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
