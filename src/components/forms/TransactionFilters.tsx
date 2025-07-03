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
    const filters: Record<string, any> = {};
    if (selectedRange?.from)
      filters.startDate = selectedRange.from.toISOString();
    if (selectedRange?.to) filters.endDate = selectedRange.to.toISOString();
    if (type) filters.type = type;
    if (categoryId) filters.categoryId = parseInt(categoryId);
    onFilterChange(filters);
  };

  const clearFilters = () => {
    setSelectedRange(undefined);
    setType('');
    setCategoryId('');
    onFilterChange({});
  };

  return (
    <div className='space-y-3'>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
        {/* Date Range Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              className={cn(
                'justify-start text-left font-normal',
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
          <PopoverContent className='w-auto p-0' align='start'>
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
          <SelectTrigger>
            <SelectValue placeholder='Filtrar por tipo' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='income'>Ingreso</SelectItem>
            <SelectItem value='expense'>Egreso</SelectItem>
          </SelectContent>
        </Select>

        {/* Categoría */}
        <Select onValueChange={setCategoryId} value={categoryId}>
          <SelectTrigger>
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
      </div>

      <div className='flex gap-2'>
        <Button onClick={applyFilters}>Aplicar filtros</Button>
        <Button variant='outline' onClick={clearFilters}>
          Limpiar
        </Button>
      </div>
    </div>
  );
}
