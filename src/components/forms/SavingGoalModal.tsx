'use client';

import { useEffect, useState } from 'react';
import { DialogClose } from '@/components/ui/dialog';
import { FormModal } from '@/components/ui/form-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import InfoHint from '@/components/ui/info-hint';
import { NumericFormat } from 'react-number-format';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';
import { useSavingAccounts } from '@/hooks/useSavingAccounts';
import type { SavingGoal } from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: SavingGoal | null;
  /** IDs de cuenta que ya tienen una meta activa (se excluyen del picker, salvo la de `editing`). */
  accountIdsWithGoal: number[];
  onSaved: () => void;
}

const toLocalYMD = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseYMD = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export default function SavingGoalModal({
  open,
  onOpenChange,
  editing,
  accountIdsWithGoal,
  onSaved,
}: Props) {
  const isEdit = !!editing;
  const { accounts } = useSavingAccounts();

  const [accountId, setAccountId] = useState('');
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setAccountId(String(editing.saving_account_id));
      setName(editing.name);
      setTargetAmount(String(editing.target_amount));
      setTargetDate(editing.target_date ? parseYMD(editing.target_date) : undefined);
    } else {
      setAccountId('');
      setName('');
      setTargetAmount('');
      setTargetDate(undefined);
    }
  }, [open, editing]);

  const availableAccounts = accounts.filter(
    (a) =>
      a.status === 'active' &&
      (!accountIdsWithGoal.includes(a.id) || a.id === editing?.saving_account_id),
  );
  const selectedAccount = accounts.find((a) => String(a.id) === accountId);

  const canSubmit = !!accountId && !!name.trim() && !!targetAmount && Number(targetAmount) > 0 && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return toast.error('Completa todos los campos');
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        target_amount: Number(targetAmount),
        target_date: targetDate ? toLocalYMD(targetDate) : null,
      };
      if (isEdit) {
        await api.put(`/saving-goals/${editing!.id}`, payload);
        toast.success('Meta actualizada');
      } else {
        await api.post('/saving-goals', { ...payload, saving_account_id: Number(accountId) });
        toast.success('Meta creada');
      }
      onSaved();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error?.response?.data?.detail || 'No se pudo guardar'
          : 'Error inesperado al guardar',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      open={open}
      onOpenChange={(o) => !saving && onOpenChange(o)}
      className='w-[min(100vw-1rem,480px)]'
      title={
        <>
          {isEdit ? 'Editar meta de ahorro' : 'Nueva meta de ahorro'}
          <InfoHint side='top'>
            La meta se ata a una cuenta completa — el progreso es simplemente el saldo de
            esa cuenta contra la meta. Si quieres varias metas, crea varias cuentas.
          </InfoHint>
        </>
      }
      footer={
        <>
          <DialogClose asChild>
            <Button
              className='bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 sm:min-w-[120px]'
              disabled={saving}
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            variant='soft-emerald'
            className='sm:min-w-[160px]'
          >
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear meta'}
          </Button>
        </>
      }
    >
      <div className='space-y-4' aria-busy={saving}>
        <div className='space-y-1'>
          <label className='text-sm font-medium'>Cuenta</label>
          <Select value={accountId} onValueChange={setAccountId} disabled={saving || isEdit}>
            <SelectTrigger className='bg-white'>
              <SelectValue placeholder='Selecciona la cuenta' />
            </SelectTrigger>
            <SelectContent className='select-solid z-[140]'>
              {availableAccounts.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  ({a.currency}) {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isEdit ? (
            <p className='text-xs text-muted-foreground'>
              La cuenta no se puede cambiar; crea una nueva meta si lo necesitas.
            </p>
          ) : (
            availableAccounts.length === 0 && (
              <p className='text-xs text-muted-foreground'>
                Todas tus cuentas activas ya tienen una meta. Crea una cuenta nueva o
                desactiva una meta existente primero.
              </p>
            )
          )}
        </div>

        <div className='space-y-1'>
          <label htmlFor='goal-name' className='text-sm font-medium'>
            Nombre
          </label>
          <Input
            id='goal-name'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Ej. Viaje a Cartagena'
            disabled={saving}
            className='bg-white'
          />
        </div>

        <div className='space-y-1'>
          <label htmlFor='goal-amount' className='text-sm font-medium'>
            Meta {selectedAccount ? `(${selectedAccount.currency})` : ''}
          </label>
          <NumericFormat
            id='goal-amount'
            value={targetAmount}
            onValueChange={({ value }) => setTargetAmount(value)}
            thousandSeparator='.'
            decimalSeparator=','
            allowNegative={false}
            decimalScale={2}
            inputMode='decimal'
            customInput={Input as never}
            disabled={saving}
            className='bg-white h-9'
          />
        </div>

        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <label className='text-sm font-medium'>Fecha objetivo (opcional)</label>
            <InfoHint side='top'>
              Si la defines, calculamos cuánto necesitas ahorrar por mes para llegar a
              tiempo.
            </InfoHint>
          </div>
          <div className='flex items-center gap-2'>
            <DatePicker value={targetDate} onChange={setTargetDate} disabled={saving} />
            {targetDate && (
              <Button
                variant='soft-slate'
                size='sm'
                onClick={() => setTargetDate(undefined)}
                disabled={saving}
              >
                Quitar
              </Button>
            )}
          </div>
        </div>
      </div>
    </FormModal>
  );
}
