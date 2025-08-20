'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { Calendar } from './calendar';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  endOfMonth,
  endOfYear,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
} from 'date-fns';

interface DateRangePickerProps {
  value: { startDate: Date; endDate: Date };
  onChange: (range: { startDate: Date; endDate: Date }) => void;
  disabled?: boolean;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const onChange = () => setMatches(m.matches);
    onChange();
    m.addEventListener?.('change', onChange);
    return () => m.removeEventListener?.('change', onChange);
  }, [query]);
  return matches;
}

export function DateRangePicker({
  value,
  onChange,
  disabled,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange | undefined>({
    from: value.startDate,
    to: value.endDate,
  });

  const isMdUp = useMediaQuery('(min-width: 768px)');
  const monthsToShow = isMdUp ? 2 : 1;

  useEffect(() => {
    if (open) setTempRange({ from: value.startDate, to: value.endDate });
  }, [open, value.startDate, value.endDate]);

  const handleAccept = () => {
    if (tempRange?.from && tempRange?.to) {
      onChange({ startDate: tempRange.from, endDate: tempRange.to });
      setOpen(false);
    }
  };

  const handleClear = () => {
    const from = startOfMonth(new Date());
    const to = new Date();
    setTempRange({ from, to });
  };

  const displayLabel = useMemo(() => {
    const { startDate, endDate } = value;
    if (!startDate || !endDate) return 'Seleccionar rango de fechas';
    const sameYear = startDate.getFullYear() === endDate.getFullYear();
    const fmt = (d: Date) =>
      format(d, sameYear ? 'dd MMM' : 'dd MMM yyyy', { locale: es });
    return `${fmt(startDate)} – ${fmt(endDate)}`;
  }, [value.startDate, value.endDate]);

  const today = new Date();
  const presets = [
    { label: 'Últimos 7 días', range: { from: subDays(today, 6), to: today } },
    {
      label: 'Este mes',
      range: { from: startOfMonth(today), to: endOfMonth(today) },
    },
    {
      label: 'Mes pasado',
      range: {
        from: startOfMonth(subMonths(today, 1)),
        to: endOfMonth(subMonths(today, 1)),
      },
    },
    {
      label: 'Este año',
      range: { from: startOfYear(today), to: endOfYear(today) },
    },
  ] as const;

  return (
    <Popover open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            'bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] border-[hsl(var(--border))]',
            'rounded-md shadow-xs hover:shadow-sm',
          )}
          aria-label='Elegir rango de fechas'
        >
          <CalendarIcon className='mr-2 h-4 w-4 opacity-70' />
          <span className='truncate'>{displayLabel}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align='start'
        sideOffset={8}
        className={cn(
          'z-[140]', // 👈 por encima del modal
          'p-0 rounded-2xl shadow-2xl w-[min(92vw,720px)]',
          'bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] border-[hsl(var(--border))]',
        )}
        style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]'>
          <div className='flex items-center gap-2'>
            <CalendarIcon className='h-4 w-4 opacity-70' />
            <span className='text-sm font-medium'>Rango de fechas</span>
          </div>
          <Button
            variant='ghost'
            size='icon'
            onClick={handleClear}
            className='hover:bg-[hsl(var(--muted))]'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>

        {/* Presets */}
        <div className='px-4 pt-3'>
          <div className='flex flex-wrap gap-2'>
            {presets.map((p) => (
              <button
                key={p.label}
                type='button'
                onClick={() => setTempRange(p.range)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm',
                  'bg-[hsl(var(--accent))] hover:bg-[hsl(var(--muted))]',
                  'border border-[hsl(var(--border))]',
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calendario (genérico en modo range) */}
        <div className='p-3'>
          <Calendar
            mode='range'
            selected={tempRange}
            onSelect={setTempRange}
            numberOfMonths={monthsToShow}
            initialFocus
          />
        </div>

        {/* Footer */}
        <div
          className='flex items-center justify-between gap-3 px-4 py-3
          border-t border-[hsl(var(--border))] bg-[hsl(var(--accent))] rounded-b-2xl'
        >
          <div className='text-xs text-muted-foreground'>
            {tempRange?.from && tempRange?.to
              ? `${format(tempRange.from, 'dd/MM/yyyy')} – ${format(
                  tempRange.to,
                  'dd/MM/yyyy',
                )}`
              : 'Selecciona un rango'}
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!tempRange?.from || !tempRange?.to}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
