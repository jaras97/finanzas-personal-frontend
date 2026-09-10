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
import InfoHint from '@/components/ui/info-hint';
import { NumericFormat } from 'react-number-format';
import { toast } from 'sonner';
import api from '@/lib/api';
import axios from 'axios';
import { useCurrencies } from '@/hooks/useCurrencies';
import type { Budget, Category } from '@/types';
import { categoryDisplayName, postableCategories } from '@/lib/categoryTree';
import { CategoryPicker } from './CategoryPicker';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si viene, el modal edita el monto de ese presupuesto (categoría y moneda quedan fijas) */
  editing?: Budget | null;
  onSaved: () => void;
}

export default function BudgetModal({ open, onOpenChange, editing, onSaved }: Props) {
  const isEdit = !!editing;

  const [categoryId, setCategoryId] = useState('');
  const [currency, setCurrency] = useState('');
  const [amount, setAmount] = useState('');
  const [amountNum, setAmountNum] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const { currencies } = useCurrencies();

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setCategoryId(String(editing.category_id));
      setCurrency(editing.currency);
      setAmount(String(editing.amount));
      setAmountNum(editing.amount);
    } else {
      setCategoryId('');
      setCurrency('');
      setAmount('');
      setAmountNum(undefined);
    }
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const { data } = await api.get('/categories', {
          params: { type: 'expense', status: 'active' },
        });
        setCategories((data as Category[]).filter((c) => !c.is_system));
      } catch {
        toast.error('Error al cargar categorías');
      }
    })();
  }, [open]);

  const decimalScale = currencies.find((c) => c.code === currency)?.decimal_digits ?? 2;

  const canSubmit =
    !!categoryId && !!currency && amountNum !== undefined && amountNum > 0 && !saving;

  const handleSubmit = async () => {
    if (!canSubmit) return toast.error('Completa todos los campos');

    setSaving(true);
    try {
      await api.post('/budgets', {
        category_id: parseInt(categoryId, 10),
        currency,
        amount: amountNum,
      });
      toast.success(isEdit ? 'Presupuesto actualizado' : 'Presupuesto creado');
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
          {isEdit ? 'Editar presupuesto' : 'Nuevo presupuesto'}
          <InfoHint side='top'>
            Define cuánto quieres gastar como máximo en una categoría este mes. El
            progreso se calcula con tus gastos reales (sin contar transferencias ni
            pagos de deuda).
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
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear presupuesto'}
          </Button>
        </>
      }
    >
      <div className='space-y-4' aria-busy={saving}>
        <div className='space-y-1'>
          <label className='text-sm font-medium'>Categoría</label>
          <CategoryPicker
                  categories={categories}
                  value={categoryId}
                  onChange={setCategoryId}
                  disabled={saving || isEdit}
                  placeholder='Selecciona la categoría'
                />
          {categories.length === 0 && (
            <p className='text-xs text-muted-foreground'>
              No tienes categorías de egreso. Crea una primero arriba en Categorías.
            </p>
          )}
        </div>

        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <label className='text-sm font-medium'>Moneda</label>
            <InfoHint side='top'>
              El presupuesto se compara solo contra gastos hechos en esta moneda.
            </InfoHint>
          </div>
          <Select value={currency} onValueChange={setCurrency} disabled={saving || isEdit}>
            <SelectTrigger className='bg-white'>
              <SelectValue placeholder='Selecciona la moneda' />
            </SelectTrigger>
            <SelectContent className='select-solid z-[140]'>
              {currencies.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isEdit && (
            <p className='text-xs text-muted-foreground'>
              La categoría y la moneda no se pueden cambiar; crea un nuevo presupuesto
              si lo necesitas.
            </p>
          )}
        </div>

        <div className='space-y-1'>
          <label htmlFor='budget-amount' className='text-sm font-medium'>
            Monto máximo mensual {currency ? `(${currency})` : ''}
          </label>
          <NumericFormat
            id='budget-amount'
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
      </div>
    </FormModal>
  );
}
