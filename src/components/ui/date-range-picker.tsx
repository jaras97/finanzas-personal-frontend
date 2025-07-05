'use client';

import * as React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { Calendar } from './calendar';

interface DateRangePickerProps {
  value: {
    startDate: Date;
    endDate: Date;
  };
  onChange: (range: { startDate: Date; endDate: Date }) => void;
  disabled?: boolean;
}

export function DateRangePicker({
  value,
  onChange,
  disabled,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>({
    from: value.startDate,
    to: value.endDate,
  });

  const handleAccept = () => {
    if (tempRange?.from && tempRange?.to) {
      onChange({
        startDate: tempRange.from,
        endDate: tempRange.to,
      });
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn(
            'w-full md:w-[300px] justify-start text-left font-normal',
            !value.startDate && 'text-muted-foreground',
          )}
          disabled={disabled}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {value.startDate ? (
            value.endDate ? (
              <>
                {format(value.startDate, 'dd/MM/yyyy')} -{' '}
                {format(value.endDate, 'dd/MM/yyyy')}
              </>
            ) : (
              format(value.startDate, 'dd/MM/yyyy')
            )
          ) : (
            <span>Seleccionar rango de fechas</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          selected={tempRange}
          onSelect={setTempRange}
          numberOfMonths={1}
        />
        <div className='flex justify-end p-2 border-t bg-gray-50'>
          <Button
            size='sm'
            onClick={handleAccept}
            disabled={!tempRange?.from || !tempRange?.to}
          >
            Aceptar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
