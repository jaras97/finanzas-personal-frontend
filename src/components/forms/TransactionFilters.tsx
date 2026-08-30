'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { DateRangePicker } from '@/components/ui/date-range-picker';

export interface Filters {
  startDate?: string; // ISO
  endDate?: string; // ISO
  type?: 'income' | 'expense';
  categoryId?: number;
  source?: 'all' | 'credit_card' | 'account';
}

/** Mes actual -- mismo default que usan las tarjetas KPI de arriba, para que
 *  "sin filtros tocados" signifique lo mismo en toda la pantalla. */
export function defaultTransactionFilters(): Filters {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  return { startDate: start.toISOString(), endDate: today.toISOString() };
}

interface Props {
  /** Filtros realmente activos -- este componente no guarda su propio estado
   *  "en borrador": cada cambio se aplica de inmediato. */
  value: Filters;
  onChange: (filters: Filters) => void;
}

type Category = {
  id: number;
  name: string;
};

export default function TransactionFilters({ value, onChange }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        setCategories(data);
      } catch {
        toast.error('Error al cargar categorías');
      }
    };
    fetchCategories();
  }, []);

  const range = {
    startDate: value.startDate ? new Date(value.startDate) : new Date(),
    endDate: value.endDate ? new Date(value.endDate) : new Date(),
  };

  return (
    <div className={cn('rounded-xl border p-3', 'bg-[hsl(var(--accent))]')}>
      <div className='grid grid-cols-1 md:grid-cols-14 gap-3 items-start'>
        {/* Rango de fechas -- aplica solo (presets de un clic, o "Aplicar"
            dentro del propio calendario para un rango personalizado) */}
        <div className='min-w-0 md:col-span-5'>
          <DateRangePicker
            value={range}
            onChange={(r) =>
              onChange({
                ...value,
                startDate: r.startDate.toISOString(),
                endDate: r.endDate.toISOString(),
              })
            }
          />
        </div>

        {/* Tipo */}
        <div className='min-w-0 md:col-span-3'>
          <Select
            value={value.type ?? ''}
            onValueChange={(v) =>
              onChange({ ...value, type: (v || undefined) as Filters['type'] })
            }
          >
            <SelectTrigger className='w-full truncate'>
              <SelectValue placeholder='Filtrar por tipo' />
            </SelectTrigger>
            <SelectContent className='z-[60] max-h-[50vh]'>
              <SelectItem value='income'>Ingreso</SelectItem>
              <SelectItem value='expense'>Egreso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Categoría */}
        <div className='min-w-0 md:col-span-4'>
          <Select
            value={value.categoryId ? String(value.categoryId) : ''}
            onValueChange={(v) =>
              onChange({
                ...value,
                categoryId: v ? parseInt(v, 10) : undefined,
              })
            }
          >
            <SelectTrigger className='w-full truncate'>
              <SelectValue placeholder='Filtrar por categoría' />
            </SelectTrigger>
            <SelectContent className='z-[60] max-h-[50vh]'>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Origen */}
        <div className='min-w-0 md:col-span-2'>
          <Select
            value={value.source ?? 'all'}
            onValueChange={(v) =>
              onChange({ ...value, source: v as Filters['source'] })
            }
          >
            <SelectTrigger className='w-full truncate'>
              <SelectValue placeholder='Filtrar por origen' />
            </SelectTrigger>
            <SelectContent className='z-[60]'>
              <SelectItem value='all'>Todos</SelectItem>
              <SelectItem value='account'>Cuentas</SelectItem>
              <SelectItem value='credit_card'>Tarjetas de crédito</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='mt-3 flex justify-end'>
        <Button
          variant='outline'
          onClick={() => onChange(defaultTransactionFilters())}
          className='font-semibold'
        >
          Limpiar filtros
        </Button>
      </div>
    </div>
  );
}
