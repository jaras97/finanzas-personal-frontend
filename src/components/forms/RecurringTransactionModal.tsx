'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { useCurrencies } from '@/hooks/useCurrencies';
import { formatCurrency } from '@/lib/format';
import { categoryDisplayName, postableCategories } from '@/lib/categoryTree';
import type {
  Category,
  RecurrenceFrequency,
  RecurringTransaction,
  SavingAccount,
} from '@/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si viene, el modal edita esa recurrencia en vez de crear una nueva */
  editing?: RecurringTransaction | null;
  onSaved: () => void;
}

const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  weekly: 'Cada semana',
  biweekly: 'Cada 2 semanas',
  monthly: 'Cada mes',
  yearly: 'Cada año',
};

const toLocalDateOnly = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;

const parseDateOnly = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export default function RecurringTransactionModal({
  open,
  onOpenChange,
  editing,
  onSaved,
}: Props) {
  const isEdit = !!editing;

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [amountNum, setAmountNum] = useState<number | undefined>(undefined);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly');
  const [nextRun, setNextRun] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<SavingAccount[]>([]);
  const { currencies } = useCurrencies();

  // Cargar el estado inicial cada vez que se abre
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setDescription(editing.description);
      setAmount(String(editing.amount));
      setAmountNum(editing.amount);
      setType(editing.type);
      setCategoryId(String(editing.category_id));
      setAccountId(String(editing.saving_account_id));
      setFrequency(editing.frequency);
      setNextRun(parseDateOnly(editing.next_run));
      setEndDate(editing.end_date ? parseDateOnly(editing.end_date) : undefined);
    } else {
      setDescription('');
      setAmount('');
      setAmountNum(undefined);
      setType('expense');
      setCategoryId('');
      setAccountId('');
      setFrequency('monthly');
      setNextRun(new Date());
      setEndDate(undefined);
    }
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [catRes, accRes] = await Promise.all([
          api.get('/categories', { params: { type, status: 'active' } }),
          api.get('/saving-accounts'),
        ]);
        setCategories((catRes.data as Category[]).filter((c) => !c.is_system));
        setAccounts(
          (accRes.data as SavingAccount[]).filter((a) => a.status === 'active'),
        );
      } catch {
        toast.error('Error al cargar cuentas o categorías');
      }
    })();
  }, [open, type]);

  const selectedAccount = accounts.find((a) => String(a.id) === accountId);
  const decimalScale =
    currencies.find((c) => c.code === selectedAccount?.currency)?.decimal_digits ?? 2;

  const canSubmit =
    !!description.trim() &&
    !!amountNum &&
    amountNum > 0 &&
    !!categoryId &&
    !!accountId &&
    !!nextRun &&
    !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return toast.error('Completa todos los campos');
    if (endDate && nextRun && endDate < nextRun) {
      return toast.error('La fecha de fin no puede ser anterior al próximo movimiento.');
    }

    setSaving(true);
    try {
      const payload = {
        description: description.trim(),
        amount: amountNum,
        type,
        category_id: parseInt(categoryId, 10),
        saving_account_id: parseInt(accountId, 10),
        frequency,
        next_run: toLocalDateOnly(nextRun!),
        end_date: endDate ? toLocalDateOnly(endDate) : null,
      };

      if (isEdit) {
        await api.put(`/recurring-transactions/${editing!.id}`, payload);
        toast.success('Recurrencia actualizada');
      } else {
        await api.post('/recurring-transactions', payload);
        toast.success('Recurrencia creada');
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
      className='w-[min(100vw-1rem,560px)]'
      title={
        <>
          {isEdit ? 'Editar movimiento recurrente' : 'Nuevo movimiento recurrente'}
          <InfoHint side='top'>
            Se registra automáticamente según la frecuencia que elijas. Ideal para
            nómina, arriendo o suscripciones.
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
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear recurrencia'}
          </Button>
        </>
      }
    >
      <div className='space-y-4' aria-busy={saving}>
          {/* Tipo */}
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Tipo</label>
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v as 'income' | 'expense');
                setCategoryId('');
              }}
              disabled={saving || isEdit}
            >
              <SelectTrigger className='bg-white'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className='select-solid z-[140]'>
                <SelectItem value='expense'>Egreso</SelectItem>
                <SelectItem value='income'>Ingreso</SelectItem>
              </SelectContent>
            </Select>
            {isEdit && (
              <p className='text-xs text-muted-foreground'>
                El tipo no se puede cambiar; crea una nueva recurrencia si lo necesitas.
              </p>
            )}
          </div>

          {/* Descripción */}
          <div className='space-y-1'>
            <label htmlFor='rec-desc' className='text-sm font-medium'>
              Descripción
            </label>
            <Input
              id='rec-desc'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Ej. Arriendo apartamento'
              disabled={saving}
              className='bg-white'
            />
          </div>

          {/* Cuenta */}
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <label className='text-sm font-medium'>Cuenta</label>
              <InfoHint side='top'>
                De aquí sale (o entra) el dinero cada vez que se genere el movimiento.
              </InfoHint>
            </div>
            <Select value={accountId} onValueChange={setAccountId} disabled={saving}>
              <SelectTrigger className='bg-white'>
                <SelectValue placeholder='Selecciona la cuenta' />
              </SelectTrigger>
              <SelectContent className='select-solid z-[140]'>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    ({formatCurrency(a.balance, a.currency)}) {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Categoría */}
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Categoría</label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={saving}>
              <SelectTrigger className='bg-white'>
                <SelectValue placeholder='Selecciona la categoría' />
              </SelectTrigger>
              <SelectContent className='select-solid z-[140]'>
                {postableCategories(categories).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {categoryDisplayName(c, categories)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categories.length === 0 && (
              <p className='text-xs text-muted-foreground'>
                No tienes categorías de {type === 'income' ? 'ingreso' : 'egreso'}. Crea
                una primero en la sección Categorías.
              </p>
            )}
          </div>

          {/* Monto */}
          <div className='space-y-1'>
            <label htmlFor='rec-amount' className='text-sm font-medium'>
              Monto {selectedAccount ? `(${selectedAccount.currency})` : ''}
            </label>
            <NumericFormat
              id='rec-amount'
              value={amount}
              onValueChange={({ value, floatValue }) => {
                setAmount(value);
                setAmountNum(floatValue);
              }}
              thousandSeparator='.'
              decimalSeparator=','
              allowNegative={false}
              decimalScale={decimalScale}
              inputMode='decimal'
              customInput={Input as never}
              disabled={saving}
              className='bg-white h-9'
            />
          </div>

          {/* Frecuencia */}
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Frecuencia</label>
            <Select
              value={frequency}
              onValueChange={(v) => setFrequency(v as RecurrenceFrequency)}
              disabled={saving}
            >
              <SelectTrigger className='bg-white'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className='select-solid z-[140]'>
                {(Object.keys(FREQUENCY_LABELS) as RecurrenceFrequency[]).map((f) => (
                  <SelectItem key={f} value={f}>
                    {FREQUENCY_LABELS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Próximo movimiento */}
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <label className='text-sm font-medium'>Próximo movimiento</label>
              <InfoHint side='top'>
                Si eliges una fecha pasada, al guardar se generarán también los
                movimientos vencidos desde esa fecha.
              </InfoHint>
            </div>
            <DatePicker value={nextRun} onChange={setNextRun} disabled={saving} />
          </div>

          {/* Fin (opcional) */}
          <div className='space-y-1'>
            <div className='flex items-center gap-2'>
              <label className='text-sm font-medium'>Finaliza el (opcional)</label>
              <InfoHint side='top'>
                Déjalo vacío si se repite indefinidamente. Al pasar esta fecha, la
                recurrencia se desactiva sola.
              </InfoHint>
            </div>
            <div className='flex items-center gap-2'>
              <DatePicker value={endDate} onChange={setEndDate} disabled={saving} />
              {endDate && (
                <Button
                  variant='soft-slate'
                  size='sm'
                  onClick={() => setEndDate(undefined)}
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
