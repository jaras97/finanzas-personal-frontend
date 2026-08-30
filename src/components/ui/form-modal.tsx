'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/**
 * Chrome compartido de los modales de formulario: header + body con scroll +
 * footer, con el tinte derivado de un solo `tone` en vez de que cada modal
 * recalcule su propio panelTint/headerFooterTint a mano (eran 20 copias
 * casi idénticas de esta misma estructura). Ver diagnóstico de diseño
 * 2026-08-29.
 *
 * No intenta unificar la lógica de envío del formulario -- cada modal sigue
 * dueño de su propio estado y de su botón de acción vía `footer`. Solo
 * estandariza lo visual.
 */

export type FormModalTone =
  | 'neutral'
  | 'emerald'
  | 'rose'
  | 'sky'
  | 'amber'
  | 'fuchsia';

const toneClasses: Record<FormModalTone, { panel: string; bar: string }> = {
  neutral: { panel: 'bg-[hsl(var(--accent))]', bar: 'bg-[hsl(var(--muted))]' },
  emerald: { panel: 'bg-emerald-50', bar: 'bg-emerald-100' },
  rose: { panel: 'bg-rose-50', bar: 'bg-rose-100' },
  sky: { panel: 'bg-sky-50', bar: 'bg-sky-100' },
  amber: { panel: 'bg-amber-50', bar: 'bg-amber-100' },
  fuchsia: { panel: 'bg-fuchsia-50', bar: 'bg-fuchsia-100' },
};

export type FormModalProps = {
  /** Controlado (como <Dialog>): si se omite, el modal maneja su propio estado. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Botón/elemento que abre el modal. Omitir si se abre de forma puramente externa. */
  trigger?: React.ReactNode;
  /** Campo a enfocar al abrir (ej. el primer input del formulario). */
  initialFocus?: React.RefObject<HTMLElement>;
  title: React.ReactNode;
  tone?: FormModalTone;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Botones del footer (Cancelar + CTA) -- el modal no asume tu lógica de envío.
   *  Omitir en modales de solo lectura (ej. un historial) para no renderizar la barra. */
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function FormModal({
  open,
  onOpenChange,
  trigger,
  initialFocus,
  title,
  tone = 'neutral',
  size = 'xl',
  footer,
  children,
  className,
}: FormModalProps) {
  const t = toneClasses[tone];

  return (
    <Dialog open={open} onOpenChange={onOpenChange} initialFocus={initialFocus}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent
        size={size}
        className={cn(
          t.panel,
          'grid grid-rows-[auto_minmax(0,1fr)_auto] max-h-[92dvh]',
          'rounded-2xl overflow-hidden',
          className,
        )}
      >
        <header className={cn('border-b px-4 py-3', t.bar)}>
          <DialogTitle className='flex items-center gap-2 text-base sm:text-lg font-semibold'>
            {title}
          </DialogTitle>
        </header>

        <section className='overflow-y-auto overscroll-contain px-4 py-4'>
          {children}
        </section>

        {footer && (
          <footer className={cn('border-t', t.bar)}>
            <div className='px-4 py-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
              {footer}
            </div>
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}
