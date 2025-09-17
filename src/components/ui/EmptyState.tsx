'use client';

import { type ComponentType } from 'react';
import { BarChart3 } from 'lucide-react';

type Props = {
  title?: string;
  description?: string;
  /** Botones o acciones opcionales (ej: <Button .../>) */
  actions?: React.ReactNode;
  /** Ícono opcional (lucide-react) */
  icon?: ComponentType<{ className?: string }>;
  /** Altura útil del contenedor */
  className?: string;
};

export function EmptyState({
  title = 'Sin datos para mostrar',
  description = 'No encontramos movimientos en el rango seleccionado.',
  actions,
  icon: Icon = BarChart3,
  className = 'h-[280px]',
}: Props) {
  return (
    <div
      role='status'
      aria-live='polite'
      className={`
        flex items-center justify-center ${className}
        rounded-xl border border-[hsl(var(--border))]
        bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]
      `}
    >
      <div className='text-center px-6'>
        <Icon className='mx-auto mb-2 h-6 w-6 opacity-70' />
        <div className='text-sm font-medium text-[hsl(var(--foreground))]'>
          {title}
        </div>
        <div className='mt-1 text-xs'>{description}</div>
        {actions ? <div className='mt-3'>{actions}</div> : null}
      </div>
    </div>
  );
}
