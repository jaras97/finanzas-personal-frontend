'use client';

import { useState, useEffect, useMemo } from 'react';
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
  const [type, setType] = useState<Account>(account.type);
  const [currency, setCurrency] = useState<SavingAccount['currency']>(
    account.currency,
  );
  const [hasTransactions, setHasTransactions] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  // IDs para accesibilidad
  const idName = 'edit-sa-name';
  const idBalance = 'edit-sa-balance';
  const idType = 'edit-sa-type';
  const idCurrency = 'edit-sa-currency';

  useEffect(() => {
    if (!account?.id) return;
    setName(account.name);
    setType(account.type);
    setCurrency(account.currency);
    checkIfHasTransactions(account.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.id]);

  const checkIfHasTransactions = async (accountId: number) => {
    try {
      const response = await api.get(
        `/saving-accounts/${accountId}/has-transactions`,
      );
      setHasTransactions(Boolean(response.data?.hasTransactions));
    } catch (error) {
      console.error('Error verificando transacciones:', error);
      toast.error('Error al verificar si la cuenta tiene transacciones.');
      setHasTransactions(true); // por seguridad, asumimos que sí tiene
    }
  };

  const isPristine = hasTransactions === false;
  const canChangeType = isPristine;
  const canChangeCurrency = isPristine && account.balance === 0;
  const canDelete = isPristine;

  const accountTypeOptions: { value: Account; label: string }[] = [
    { value: 'cash', label: 'Efectivo' },
    { value: 'bank', label: 'Bancaria' },
    { value: 'investment', label: 'Inversión' },
  ];

  const currencyOptions = [
    { value: 'COP', label: 'COP — Peso Colombiano' },
    { value: 'USD', label: 'USD — Dólar' },
    { value: 'EUR', label: 'EUR — Euro' },
  ] as const;

  const saving = useMemo(() => loading, [loading]);

  const handleUpdate = async () => {
    const cleaned = name.trim();
    if (!cleaned) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = { name: cleaned };
      if (canChangeType) payload.type = type;
      if (canChangeCurrency) payload.currency = currency;

      await api.put(`/saving-accounts/${account.id}`, payload);
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

  const handleDelete = async () => {
    const confirmed = window.confirm(
      'Esta acción eliminará la cuenta de forma permanente. ¿Deseas continuar?',
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      await api.delete(`/saving-accounts/${account.id}`);
      toast.success('Cuenta eliminada correctamente');
      onOpenChange(false);
      onUpdated();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error?.response?.data?.detail || 'No se pudo eliminar la cuenta',
        );
      } else {
        toast.error('Error inesperado al eliminar la cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className='bg-card text-foreground'>
        <DialogHeader>
          <DialogTitle>Editar cuenta de ahorro</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Nombre */}
          <div className='space-y-1'>
            <label htmlFor={idName} className='text-sm font-medium'>
              Nombre de la cuenta
            </label>
            <Input
              id={idName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Saldo actual (solo lectura) */}
          <div className='space-y-1'>
            <label htmlFor={idBalance} className='text-sm font-medium'>
              Saldo actual
            </label>
            <Input
              id={idBalance}
              value={`${formatCurrency(account.balance)} ${account.currency}`}
              disabled
            />
            <p className='text-xs text-muted-foreground'>
              El saldo no puede editarse manualmente. Para modificarlo, realiza{' '}
              <b>depósitos</b> o <b>retiros</b>.
            </p>
          </div>

          {/* Tipo de cuenta */}
          <div className='space-y-1'>
            <label htmlFor={idType} className='text-sm font-medium'>
              Tipo de cuenta
            </label>
            {hasTransactions === null ? (
              <p className='text-sm text-muted-foreground'>
                Verificando movimientos…
              </p>
            ) : canChangeType ? (
              <select
                id={idType}
                value={type}
                onChange={(e) => setType(e.target.value as Account)}
                className='w-full border rounded-md px-3 py-2 text-sm bg-background'
                disabled={saving}
              >
                {accountTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <p className='text-xs text-muted-foreground'>
                No puedes cambiar el tipo porque la cuenta tiene movimientos.
              </p>
            )}
          </div>

          {/* Moneda */}
          <div className='space-y-1'>
            <label htmlFor={idCurrency} className='text-sm font-medium'>
              Moneda
            </label>
            {hasTransactions === null ? (
              <div className='h-6' />
            ) : canChangeCurrency ? (
              <select
                id={idCurrency}
                value={currency}
                onChange={(e) =>
                  setCurrency(e.target.value as SavingAccount['currency'])
                }
                className='w-full border rounded-md px-3 py-2 text-sm bg-background'
                disabled={saving}
              >
                {currencyOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <p className='text-xs text-muted-foreground'>
                La moneda solo puede cambiarse si el saldo es <b>0</b> y la
                cuenta no tiene movimientos.
              </p>
            )}
          </div>

          <Button
            onClick={handleUpdate}
            className='w-full'
            disabled={saving || hasTransactions === null}
          >
            {saving ? 'Actualizando…' : 'Actualizar cuenta'}
          </Button>

          {/* Eliminar (solo prístina) */}
          {canDelete && (
            <Button
              variant='destructive'
              onClick={handleDelete}
              className='w-full'
              disabled={saving}
            >
              Eliminar cuenta
            </Button>
          )}

          {/* Hint de estado */}
          {isPristine && (
            <p className='text-xs text-emerald-600'>
              Cuenta prístina: puedes cambiar el <b>tipo</b>, la <b>moneda</b> y
              también eliminarla (incluso con saldo).
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
