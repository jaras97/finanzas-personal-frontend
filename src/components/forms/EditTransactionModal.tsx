'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
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
import api from '@/lib/api';
import { toast } from 'sonner';
import { TransactionWithCategoryRead } from '@/types';
import axios from 'axios';
import { cn } from '@/lib/utils';
import InfoHint from '@/components/ui/info-hint';
import { DatePicker } from '@/components/ui/date-picker';

type Category = {
  id: number;
  name: string;
  type: 'income' | 'expense' | 'both';
  is_system?: boolean;
};

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
  const [categories, setCategories] = useState<Category[]>([]);
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

  // Tinte según tipo (usa tailwind + tus tokens)
  const tone: 'emerald' | 'rose' =
    transaction.type === 'income' ? 'emerald' : 'rose';

  const panelTint = tone === 'emerald' ? 'bg-emerald-50' : 'bg-rose-50';

  const headerFooterTint =
    tone === 'emerald' ? 'bg-emerald-100' : 'bg-rose-100';

  const ctaClass =
    tone === 'emerald'
      ? 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-300'
      : 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300';

  // Cargar categorías activas del tipo
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get<Category[]>('/categories', {
          params: { type: transaction.type, status: 'active' },
        });
        setCategories((data || []).filter((c) => !c.is_system));
      } catch {
        toast.error('Error al cargar categorías');
      }
    };
    if (open) fetchCategories();
  }, [open, transaction.type]);

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
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent
        // Headless UI panel: nada de props de Radix aquí
        className={cn(
          'w-[min(100vw-1rem,560px)]',
          'grid grid-rows-[auto,1fr,auto] max-h-[92dvh]',
          'rounded-2xl overflow-hidden', // evita solapamientos de borde
          panelTint,
        )}
      >
        {/* HEADER */}
        <header className={cn('border-b px-4 py-3', headerFooterTint)}>
          <DialogTitle className='flex items-center gap-2 text-base sm:text-lg font-semibold'>
            Editar Transacción
            <InfoHint side='top'>
              Solo puedes editar <b>descripción</b>, <b>categoría</b> y{' '}
              <b>fecha</b>. Montos y cuentas no cambian por trazabilidad.
            </InfoHint>
          </DialogTitle>
        </header>

        {/* BODY (solo aquí hay scroll) */}
        <section
          className='overflow-y-auto overscroll-contain px-4 py-4'
          aria-busy={saving}
        >
          <div className='space-y-4'>
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
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={saving || categories.length === 0}
              >
                <SelectTrigger id={idCat} className='bg-white'>
                  <SelectValue
                    placeholder={
                      categories.length
                        ? `Seleccionar categoría (${typeLabel})`
                        : 'No hay categorías disponibles'
                    }
                  />
                </SelectTrigger>
                {/* z alto para ir sobre el modal (Dialog panel ~ z-[110]) */}
                <SelectContent className='select-solid z-[140]'>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        </section>

        {/* FOOTER */}
        <footer className={cn('border-t', headerFooterTint)}>
          <div className='px-4 py-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
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
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
