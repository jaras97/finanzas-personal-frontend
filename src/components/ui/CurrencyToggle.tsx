'use client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { currencyType } from '@/types';

type Props = {
  value: currencyType;
  onChange: (c: any) => void;
  disabled?: boolean;
};

export function CurrencyToggle({ value, onChange, disabled }: Props) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className='w-32' aria-label='Moneda'>
        <SelectValue placeholder='Selecciona moneda' />
      </SelectTrigger>

      <SelectContent className='select-solid'>
        <SelectItem value='COP'>COP</SelectItem>
        <SelectItem value='USD'>USD</SelectItem>
      </SelectContent>
    </Select>
  );
}
