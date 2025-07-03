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
import { format } from 'date-fns';
import { DateRange, DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onFilterChange: (filters: Filters) => void;
}

export interface Filters {
  startDate?: string; // ISO string
  endDate?: string; // ISO string
  type?: 'income' | 'expense';
  categoryId?: number;
  source?: 'all' | 'credit_card' | 'account'; // ✅ nuevo
}

type Category = {
  id: number;
  name: string;
};

export default function TransactionFilters({ onFilterChange }: Props) {
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(
    undefined,
  );
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
    if (selectedRange?.from)
      filters.startDate = selectedRange.from.toISOString();
    if (selectedRange?.to) filters.endDate = selectedRange.to.toISOString();
    if (type) filters.type = type as 'income' | 'expense';
    if (categoryId) filters.categoryId = parseInt(categoryId);
    if (source && source !== 'all') filters.source = source; // ✅ agregado

    onFilterChange(filters);
  };

  const clearFilters = () => {
    setSelectedRange(undefined);
    setType('');
    setCategoryId('');
    setSource('all');
    onFilterChange({});
  };

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
        {/* Date Range Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              className={cn(
                'justify-start text-left font-normal w-full',
                !selectedRange && 'text-muted-foreground',
              )}
            >
              <CalendarIcon className='mr-2 h-4 w-4' />
              {selectedRange?.from ? (
                selectedRange.to ? (
                  <>
                    {format(selectedRange.from, 'dd MMM yyyy')} -{' '}
                    {format(selectedRange.to, 'dd MMM yyyy')}
                  </>
                ) : (
                  format(selectedRange.from, 'dd MMM yyyy')
                )
              ) : (
                <span>Seleccionar rango de fechas</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align='start'
            className='p-2 bg-card text-card-foreground rounded-md shadow-md'
          >
            <DayPicker
              mode='range'
              selected={selectedRange}
              onSelect={setSelectedRange}
              numberOfMonths={1}
            />
          </PopoverContent>
        </Popover>

        {/* Tipo */}
        <Select onValueChange={setType} value={type}>
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Filtrar por tipo' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='income'>Ingreso</SelectItem>
            <SelectItem value='expense'>Egreso</SelectItem>
          </SelectContent>
        </Select>

        {/* Categoría */}
        <Select onValueChange={setCategoryId} value={categoryId}>
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Filtrar por categoría' />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id.toString()}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Origen */}
        <Select
          onValueChange={(v) =>
            setSource(v as 'all' | 'credit_card' | 'account')
          }
          value={source}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Filtrar por origen' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Todos</SelectItem>
            <SelectItem value='account'>Cuentas</SelectItem>
            <SelectItem value='credit_card'>Tarjetas de crédito</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='flex flex-wrap gap-2'>
        <Button onClick={applyFilters} className='font-semibold'>
          Aplicar filtros
        </Button>
        <Button
          variant='secondary'
          onClick={clearFilters}
          className='font-semibold'
        >
          Limpiar
        </Button>
      </div>
    </div>
  );
}
