'use client';

import { useEffect, useMemo, useState } from 'react';
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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Account, SavingAccount } from '@/types';
import { formatCurrency } from '@/lib/format';
import axios from 'axios';
import InfoHint from '@/components/ui/info-hint';
import { cn } from '@/lib/utils';

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

  // alias para consistencia con otros modales
  const saving = useMemo(() => loading, [loading]);

  const handleUpdate = async () => {
    if (saving) return; // evita dobles clics
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
    if (saving) return;
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
        {/* Contenedor scrollable (mejor para móvil/teclado) */}
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
              Editar cuenta de ahorro
              <InfoHint side='top'>
                Cambia el <b>nombre</b>. El <b>tipo</b> y la <b>moneda</b> solo
                pueden ajustarse si la cuenta está <i>prístina</i> (sin
                movimientos) y la moneda además requiere saldo en <b>0</b>.
              </InfoHint>
            </DialogTitle>
          </DialogHeader>

          <div className='space-y-4'>
            {/* Nombre */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idName} className='text-sm font-medium'>
                  Nombre de la cuenta
                </label>
                <InfoHint side='top'>
                  Cómo verás esta cuenta en listas y transferencias (ej.
                  “Billetera”, “Ahorros Bancolombia”).
                </InfoHint>
              </div>
              <Input
                id={idName}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
              />
            </div>

            {/* Saldo actual (solo lectura) */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idBalance} className='text-sm font-medium'>
                  Saldo actual
                </label>
                <InfoHint side='top'>
                  El saldo no se edita aquí. Usa <b>depósitos</b> o{' '}
                  <b>retiros</b> para modificarlo.
                </InfoHint>
              </div>
              <Input
                id={idBalance}
                value={`${formatCurrency(account.balance)} ${account.currency}`}
                disabled
              />
            </div>

            {/* Tipo de cuenta */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idType} className='text-sm font-medium'>
                  Tipo de cuenta
                </label>
                <InfoHint side='top'>
                  Solo afecta la <b>clasificación visual</b> e iconografía.
                </InfoHint>
              </div>

              {hasTransactions === null ? (
                <p className='text-sm text-muted-foreground'>
                  Verificando movimientos…
                </p>
              ) : canChangeType ? (
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as Account)}
                  disabled={saving}
                >
                  <SelectTrigger id={idType}>
                    <SelectValue placeholder='Selecciona el tipo' />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className='text-xs text-muted-foreground'>
                  No puedes cambiar el tipo porque la cuenta tiene movimientos.
                </p>
              )}
            </div>

            {/* Moneda */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idCurrency} className='text-sm font-medium'>
                  Moneda
                </label>
                <InfoHint side='top'>
                  Cambia la moneda solo si la cuenta está prístina y con saldo{' '}
                  <b>0</b>.
                </InfoHint>
              </div>

              {hasTransactions === null ? (
                <div className='h-6' />
              ) : canChangeCurrency ? (
                <Select
                  value={currency}
                  onValueChange={(v) =>
                    setCurrency(v as SavingAccount['currency'])
                  }
                  disabled={saving}
                >
                  <SelectTrigger id={idCurrency}>
                    <SelectValue placeholder='Selecciona la moneda' />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              aria-disabled={saving || hasTransactions === null}
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
                aria-disabled={saving}
              >
                Eliminar cuenta
              </Button>
            )}

            {/* Estado prístina */}
            {isPristine && (
              <div className='flex items-center gap-2'>
                <InfoHint side='top'>
                  Cuenta <b>prístina</b>: puedes cambiar <b>tipo</b>,{' '}
                  <b>moneda</b> o incluso <b>eliminarla</b> (aunque tenga
                  saldo).
                </InfoHint>
                <span className='text-xs text-emerald-600'>
                  Cuenta prístina habilitada
                </span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
