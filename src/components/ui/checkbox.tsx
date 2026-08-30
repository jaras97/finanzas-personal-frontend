'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'checked' | 'type'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * Checkbox nativo (sin @radix-ui/react-checkbox, no está entre las
 * dependencias del proyecto) con la misma API `checked`/`onCheckedChange`
 * que el resto de controles del sistema de diseño, para poder reemplazarlo
 * por uno de Radix más adelante sin tocar quien lo usa.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => (
    <input
      ref={ref}
      type='checkbox'
      checked={checked ?? false}
      disabled={disabled}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className={cn(
        'h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    />
  ),
);
Checkbox.displayName = 'Checkbox';
