'use client';

import { useEffect, useMemo, useState } from 'react';
import { DialogClose } from '@/components/ui/dialog';
import { FormModal } from '@/components/ui/form-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from 'sonner';
import { TransactionWithCategoryRead } from '@/types';
import axios from 'axios';
import { cn } from '@/lib/utils';
import InfoHint from '@/components/ui/info-hint';
import { DatePicker } from '@/components/ui/date-picker';
import { categoryDisplayName, postableCategories } from '@/lib/categoryTree';
import { CategoryPicker } from './CategoryPicker';
import { useCategories } from '@/hooks/useCategories';
import type { Category } from '@/types';

// Tipo local reducido. `parent_id`/`parent_name` son necesarios desde el
// modelo grupo/hoja: sin ellos el selector ofrecería grupos, que no reciben
// movimientos, y el guardado fallaría con un 400.
// Se usa el tipo compartido: el local reducido ya hizo invisibles el color,
// el icono y el padre, y ahora el selector necesita la categoría completa.

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionWithCategoryRead;
  onUpdated: () => void;
}

export default function EditTransactionModal({
  open,
  onOpenChange,
  transaction,
  onUpdated,
}: Props) {
  const [description, setDescription] = useState(transaction.description ?? '');
  const [categoryId, setCategoryId] = useState<string>(
    transaction.category ? transaction.category.id.toString() : '',
  );
  const [date, setDate] = useState<Date | undefined>(
    transaction.date ? new Date(transaction.date) : new Date(),
  );
  const [saving, setSaving] = useState(false);

  const idDesc = 'edit-tx-desc';
  const idCat = 'edit-tx-cat';

  const dateToIsoAtLocalNoon = (d: Date) =>
    new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      12,
      0,
      0,
    ).toISOString();

  const typeLabel = transaction.type === 'income' ? 'Ingreso' : 'Egreso';

  // Tinte según tipo
  const tone: 'emerald' | 'rose' =
    transaction.type === 'income' ? 'emerald' : 'rose';

  const ctaClass =
    tone === 'emerald'
      ? 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-300'
      : 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300';

  // Categorías activas del tipo del movimiento. Las de sistema no se ofrecen:
  // mover un gasto a «Transferencia» lo escondería de su propio desglose.
  const { categories: todasLasCategorias } = useCategories({
    type: transaction.type as 'income' | 'expense',
    status: 'active',
    enabled: open,
  });
  const categories = useMemo(
    () => todasLasCategorias.filter((c) => !c.is_system),
    [todasLasCategorias],
  );

  // Reset cuando cambia la transacción
  useEffect(() => {
    setDescription(transaction.description ?? '');
    setCategoryId(
      transaction.category ? transaction.category.id.toString() : '',
    );
    setDate(transaction.date ? new Date(transaction.date) : new Date());
  }, [
    transaction.id,
    transaction.description,
    transaction.category,
    transaction.date,
  ]);

  const handleSubmit = async () => {
    if (saving) return;
    if (!description.trim() || !categoryId || !date) {
      toast.error('Completa descripción, categoría y fecha');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/transactions/${transaction.id}`, {
        description: description.trim(),
        category_id: parseInt(categoryId, 10),
        date: dateToIsoAtLocalNoon(date),
      });
      toast.success('Transacción actualizada');
      onOpenChange(false);
      onUpdated();
    } catch (error) {
      toast.error(
        axios.isAxiosError(error)
          ? error?.response?.data?.detail || 'Error al actualizar transacción'
          : 'Error al actualizar transacción',
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
      tone={tone}
      title={
        <>
          Editar Transacción
          <InfoHint side='top'>
            Solo puedes editar <b>descripción</b>, <b>categoría</b> y{' '}
            <b>fecha</b>. Montos y cuentas no cambian por trazabilidad.
          </InfoHint>
        </>
      }
      footer={
        <>
          <DialogClose asChild>
            <Button
              className='bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 sm:min-w-[140px]'
              disabled={saving}
            >
              Cancelar
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            aria-disabled={saving}
            className={cn('sm:min-w-[160px]', ctaClass)}
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </>
      }
    >
      <div className='space-y-4' aria-busy={saving}>
            {/* Descripción */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idDesc} className='text-sm font-medium'>
                  Descripción
                </label>
                <InfoHint side='top'>Un texto corto y claro.</InfoHint>
              </div>
              <Input
                id={idDesc}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={saving}
                className='bg-white'
              />
            </div>

            {/* Categoría */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <label htmlFor={idCat} className='text-sm font-medium'>
                  Categoría
                </label>
                <InfoHint side='top'>
                  Solo categorías activas para <b>{typeLabel}</b> (o{' '}
                  <b>Ambas</b>).
                </InfoHint>
              </div>
              <CategoryPicker
                  categories={categories}
                  value={categoryId}
                  onChange={setCategoryId}
                  disabled={saving || categories.length === 0}
                  id={idCat}
                  placeholder={categories.length
                        ? `Seleccionar categoría (${typeLabel})`
                        : 'No hay categorías disponibles'}
                />
              {categories.length === 0 && (
                <div className='text-xs text-amber-600'>
                  No tienes categorías activas de este tipo.
                </div>
              )}
            </div>

            {/* Fecha */}
            <div className='space-y-1'>
              <div className='flex items-center justify-between gap-2'>
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium'>Fecha</span>
                  <InfoHint side='top'>
                    Se guarda a <b>mediodía local</b> para evitar saltos por
                    husos horarios.
                  </InfoHint>
                </div>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  onClick={() => setDate(new Date())}
                  disabled={saving}
                  className='h-8'
                >
                  Hoy
                </Button>
              </div>

              {/* Nuestro DatePicker (Popover sólido y por encima del modal) */}
              <DatePicker
                value={date}
                onChange={setDate}
                disabled={saving}
                className='z-[140]' // PopoverContent
                buttonClassName='bg-white h-9' // altura y contraste como input
              />
            </div>
      </div>
    </FormModal>
  );
}
