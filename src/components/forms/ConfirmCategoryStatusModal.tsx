'use client';

import { Category } from '@/types';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import { FormModal } from '@/components/ui/form-modal';

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

  const ctaClass = isDeactivate
    ? 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-300'
    : 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-300';

  return (
    <FormModal
      open={open}
      onOpenChange={(o) => !processing && onOpenChange(o)}
      size='sm'
      className='w-[min(100vw-1rem,520px)]'
      tone={isDeactivate ? 'rose' : 'emerald'}
      title={isDeactivate ? 'Desactivar categoría' : 'Reactivar categoría'}
      footer={
        <>
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
            className={`sm:min-w-[160px] ${ctaClass}`}
          >
            {processing
              ? isDeactivate
                ? 'Desactivando…'
                : 'Reactivando…'
              : isDeactivate
              ? 'Desactivar'
              : 'Reactivar'}
          </Button>
        </>
      }
    >
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
    </FormModal>
  );
}
