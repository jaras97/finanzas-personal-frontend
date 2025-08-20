// components/ui/calendar.tsx
'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import 'react-day-picker/dist/style.css';

// Hacemos el wrapper genérico: acepta todas las props de DayPicker.
// Así sirve para `mode="single"` (Date) y `mode="range"` (DateRange).
export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  className?: string;
};

export function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={es}
      showOutsideDays
      fixedWeeks
      captionLayout='dropdown'
      startMonth={new Date(new Date().getFullYear() - 5, 0)}
      endMonth={new Date(new Date().getFullYear() + 5, 11)}
      className={cn('rdp-theme', className)}
      {...props}
    />
  );
}
