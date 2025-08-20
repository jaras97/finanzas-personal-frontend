'use client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Props = {
  value: 'COP' | 'USD' | 'EUR';
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
        <SelectItem value='EUR'>EUR</SelectItem>
      </SelectContent>
    </Select>
  );
}
