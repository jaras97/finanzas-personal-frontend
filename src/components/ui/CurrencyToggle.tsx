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
  onChange: (c: currencyType) => void;
  options: currencyType[];
  disabled?: boolean;
};

export function CurrencyToggle({ value, onChange, options, disabled }: Props) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || options.length === 0}>
      <SelectTrigger className='w-32' aria-label='Moneda'>
        <SelectValue placeholder='Selecciona moneda' />
      </SelectTrigger>

      <SelectContent className='select-solid'>
        {options.map((code) => (
          <SelectItem key={code} value={code}>
            {code}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
