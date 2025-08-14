'use client';

import { useEffect, useState } from 'react';
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
import api from '@/lib/api';
import { toast } from 'sonner';
import { TransactionWithCategoryRead } from '@/types';
import axios from 'axios';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DayPicker } from 'react-day-picker';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
  const idDate = 'edit-tx-date';

  // Helper: ISO a mediodía local
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

  // Cargar categorías (solo del tipo de la transacción actual y activas)
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
  }, [transaction.id]);

  const handleSubmit = async () => {
    if (!description.trim() || !categoryId || !date) {
      toast.error('Completa descripción, categoría y fecha');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/transactions/${transaction.id}`, {
        description: description.trim(),
        category_id: parseInt(categoryId, 10),
        date: dateToIsoAtLocalNoon(date), // ⬅️ enviamos mediodía local
      });
      toast.success('Transacción actualizada');
      onOpenChange(false);
      onUpdated();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error?.response?.data?.detail || 'Error al actualizar transacción',
        );
      } else {
        toast.error('Error al actualizar transacción');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className='bg-card text-foreground max-w-md'>
        <DialogHeader>
          <DialogTitle>Editar Transacción</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <p className='text-sm text-muted-foreground'>
            Puedes modificar la <b>descripción</b>, la <b>categoría</b> y la{' '}
            <b>fecha</b>. Los montos y cuentas no se editan por trazabilidad.
          </p>

          {/* Descripción */}
          <div className='space-y-1'>
            <label htmlFor={idDesc} className='text-sm font-medium'>
              Descripción
            </label>
            <Input
              id={idDesc}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Categoría */}
          <div className='space-y-1'>
            <label htmlFor={idCat} className='text-sm font-medium'>
              Categoría
            </label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              disabled={saving || categories.length === 0}
            >
              <SelectTrigger id={idCat}>
                <SelectValue
                  placeholder={
                    categories.length
                      ? `Seleccionar categoría (${typeLabel})`
                      : 'No hay categorías disponibles'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground'>
              Solo se muestran categorías del tipo <b>{typeLabel}</b> o{' '}
              <b>Ambas</b>, para mantener coherencia con la transacción.
            </p>
            {categories.length === 0 && (
              <p className='text-xs text-amber-600'>
                No tienes categorías activas de este tipo. Crea una para poder
                reasignar esta transacción.
              </p>
            )}
          </div>

          {/* Fecha */}
          <div className='space-y-1'>
            <label htmlFor={idDate} className='text-sm font-medium'>
              Fecha
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id={idDate}
                  variant='outline'
                  className={cn(
                    'justify-start text-left font-normal w-full',
                    !date && 'text-muted-foreground',
                  )}
                  disabled={saving}
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {date ? (
                    format(date, 'dd MMM yyyy')
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align='start'
                className='p-0 bg-popover text-popover-foreground border border-border rounded-md'
              >
                <DayPicker
                  mode='single'
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className='text-xs text-muted-foreground'>
              Guardamos la fecha a <b>mediodía local</b> para evitar saltos por
              husos horarios.
            </p>
          </div>

          <Button onClick={handleSubmit} className='w-full' disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
