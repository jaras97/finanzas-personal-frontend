// components/ui/date-picker.tsx
'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';

export function DatePicker({
  value,
  onChange,
  disabled,
  className,
  buttonClassName,
}: {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={(v) => !disabled && setOpen(v)}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal truncate',
            'bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] border-[hsl(var(--border))]',
            'rounded-md shadow-xs hover:shadow-sm',
            buttonClassName,
          )}
          aria-label='Elegir fecha'
        >
          <CalendarIcon className='mr-2 h-4 w-4 opacity-70' />
          {value ? value.toLocaleDateString() : <span>Seleccionar fecha</span>}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align='start'
        sideOffset={8}
        className={cn(
          // 🔼 por encima del DialogContent (z-90) y del overlay (z-80)
          'z-[140]',
          'p-3 rounded-2xl shadow-2xl w-[min(92vw,360px)]',
          // 👇 sólido, sin transparencias
          'bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] border-[hsl(var(--border))]',
          className,
        )}
        style={{ backdropFilter: 'none', WebkitBackdropFilter: 'none' }}
      >
        {/* Ahora Calendar es genérico: usamos mode="single" */}
        <Calendar
          mode='single'
          selected={value}
          onSelect={(d) => {
            onChange(d);
            setOpen(false);
          }}
          initialFocus
        />

        <div className='mt-3 flex gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => onChange(undefined)}
          >
            Limpiar
          </Button>
          <Button type='button' onClick={() => onChange(new Date())}>
            Hoy
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
