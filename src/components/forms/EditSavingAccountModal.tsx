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
  const [type, setType] = useState(account.type || '');

  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type || '');
    }
  }, [account]);

  const handleUpdate = async () => {
    if (!name) {
      toast.error('El nombre es obligatorio');
      return;
    }

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
    }
  };

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

          {/* 🚩 Si deseas habilitar edición de tipo, agrega un Select aquí */}
          <Button onClick={handleUpdate} className='w-full'>
            Actualizar cuenta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
