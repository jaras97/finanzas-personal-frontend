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

interface Props {
  onFilterChange: (filters: Filters) => void;
}

export interface Filters {
  startDate?: string; // ISO
  endDate?: string; // ISO
  type?: 'income' | 'expense';
  categoryId?: number;
  source?: 'all' | 'credit_card' | 'account';
}

type Category = {
  id: number;
  name: string;
};

export default function TransactionFilters({ onFilterChange }: Props) {
  // Rango por defecto: mes actual → hoy
  const [range, setRange] = useState<{ startDate: Date; endDate: Date }>(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: start, endDate: today };
  });

  const [type, setType] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [source, setSource] = useState<'all' | 'credit_card' | 'account'>(
    'all',
  );

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

  const applyFilters = () => {
    const filters: Filters = {};
    if (range?.startDate) filters.startDate = range.startDate.toISOString();
    if (range?.endDate) filters.endDate = range.endDate.toISOString();
    if (type) filters.type = type as 'income' | 'expense';
    if (categoryId) filters.categoryId = parseInt(categoryId, 10);
    if (source && source !== 'all') filters.source = source;
    onFilterChange(filters);
  };

  const clearFilters = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    setRange({ startDate: start, endDate: today });
    setType('');
    setCategoryId('');
    setSource('all');
    onFilterChange({});
  };

  return (
    <div className='space-y-4'>
      {/* Panel con leve realce */}
      <div className={cn('rounded-xl border p-3', 'bg-[hsl(var(--accent))]')}>
        <div className='grid grid-cols-1 md:grid-cols-14 gap-3 items-start'>
          {/* Rango de fechas */}
          <div className='min-w-0 md:col-span-5'>
            <DateRangePicker
              value={{ startDate: range.startDate, endDate: range.endDate }}
              onChange={(r) => setRange(r)}
            />
          </div>

          {/* Tipo */}
          <div className='min-w-0 md:col-span-3'>
            <Select onValueChange={setType} value={type}>
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
            <Select onValueChange={setCategoryId} value={categoryId}>
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
              onValueChange={(v) =>
                setSource(v as 'all' | 'credit_card' | 'account')
              }
              value={source}
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
      </div>

      {/* Acciones */}
      <div className='flex flex-wrap gap-2 justify-end'>
        <Button
          variant='outline'
          onClick={clearFilters}
          className='font-semibold'
        >
          Limpiar
        </Button>
        <Button
          variant='soft-sky'
          onClick={applyFilters}
          className='font-semibold'
        >
          Aplicar filtros
        </Button>
      </div>
    </div>
  );
}
