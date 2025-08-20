'use client';

import { Category } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category;
  action: 'deactivate' | 'reactivate';
  processing: boolean;
  onConfirm: () => void;
};

export default function ConfirmCategoryStatusModal({
  open,
  onOpenChange,
  category,
  action,
  processing,
  onConfirm,
}: Props) {
  const isDeactivate = action === 'deactivate';

  const panelTint = isDeactivate ? 'bg-rose-50' : 'bg-emerald-50';
  const headerFooterTint = isDeactivate ? 'bg-rose-100' : 'bg-emerald-100';
  const ctaClass = isDeactivate
    ? 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300'
    : 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-300';

  return (
    <Dialog open={open} onOpenChange={(o) => !processing && onOpenChange(o)}>
      <DialogContent
        size='sm'
        className={cn(
          'grid grid-rows-[auto,1fr,auto] max-h-[92dvh]',
          'w-[min(100vw-1rem,520px)] rounded-2xl overflow-hidden',
          panelTint,
        )}
      >
        {/* HEADER */}
        <header className={cn('border-b px-4 py-3', headerFooterTint)}>
          <DialogTitle className='text-base sm:text-lg font-semibold'>
            {isDeactivate ? 'Desactivar categoría' : 'Reactivar categoría'}
          </DialogTitle>
        </header>

        {/* BODY */}
        <section className='overflow-y-auto overscroll-contain px-4 py-4'>
          <p className='text-sm text-muted-foreground'>
            ¿Seguro que deseas {isDeactivate ? 'desactivar' : 'reactivar'} la
            categoría <span className='font-semibold'>{category.name}</span>?
          </p>
          {isDeactivate ? (
            <ul className='mt-3 text-xs list-disc pl-5 text-muted-foreground space-y-1'>
              <li>
                No se perderán datos; solo dejará de estar disponible al crear
                transacciones.
              </li>
              <li>Puedes reactivarla más adelante.</li>
            </ul>
          ) : (
            <p className='mt-3 text-xs text-muted-foreground'>
              La categoría volverá a estar disponible para nuevas transacciones.
            </p>
          )}
        </section>

        {/* FOOTER */}
        <footer className={cn('border-t px-4 py-3', headerFooterTint)}>
          <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
            <DialogClose asChild>
              <Button
                className='bg-white text-slate-800 hover:bg-slate-50 border border-slate-200 sm:min-w-[120px]'
                disabled={processing}
              >
                Cancelar
              </Button>
            </DialogClose>
            <Button
              onClick={onConfirm}
              disabled={processing}
              aria-disabled={processing}
              className={cn('sm:min-w-[160px]', ctaClass)}
            >
              {processing
                ? isDeactivate
                  ? 'Desactivando…'
                  : 'Reactivando…'
                : isDeactivate
                ? 'Desactivar'
                : 'Reactivar'}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
