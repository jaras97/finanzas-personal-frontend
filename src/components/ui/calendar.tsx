// components/ui/calendar.tsx

'use client';

import * as React from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { cn } from '@/lib/utils';

interface CalendarProps {
  className?: string;
  selected: DateRange;
  onSelect: (range: DateRange | undefined) => void;
  numberOfMonths?: number;
  initialFocus?: boolean;
}

export function Calendar({
  className,
  selected,
  onSelect,
  numberOfMonths = 1,
  initialFocus = false,
}: CalendarProps) {
  return (
    <DayPicker
      mode='range'
      selected={selected}
      onSelect={onSelect}
      numberOfMonths={numberOfMonths}
      defaultMonth={selected?.from ?? new Date()}
      className={cn('rounded-md border bg-white p-3 shadow-md', className)}
      initialFocus={initialFocus}
      captionLayout='dropdown'
      fromYear={new Date().getFullYear() - 5}
      toYear={new Date().getFullYear() + 5}
    />
  );
}
