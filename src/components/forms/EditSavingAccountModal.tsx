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
import { SavingAccount } from '@/types';

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
  const [balance, setBalance] = useState(account.balance.toString());
  const [type, setType] = useState(account.type || '');

  useEffect(() => {
    if (account) {
      setName(account.name);
      setBalance(account.balance.toString());
      setType(account.type || '');
    }
  }, [account]);

  const handleUpdate = async () => {
    if (!name || !balance) {
      toast.error('Completa todos los campos');
      return;
    }

    try {
      await api.put(`/saving-accounts/${account.id}`, {
        name,
        balance: parseFloat(balance),
        type: type || 'general',
      });
      toast.success('Cuenta actualizada correctamente');
      onOpenChange(false);
      onUpdated();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.detail || 'Error al actualizar cuenta',
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar cuenta de ahorro</DialogTitle>
        </DialogHeader>
        <div className='space-y-2'>
          <Input
            placeholder='Nombre de la cuenta'
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder='Saldo'
            type='number'
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />
          {/* 🚩 Agrega aquí un Select para type si deseas permitir edición */}
          <Button onClick={handleUpdate}>Actualizar cuenta</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
