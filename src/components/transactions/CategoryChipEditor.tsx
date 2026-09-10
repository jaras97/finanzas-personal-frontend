'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CategoryPicker } from '@/components/forms/CategoryPicker';
import { cn } from '@/lib/utils';
import { categoryDisplayName } from '@/lib/categoryTree';
import { categoryBadgeClasses } from '@/lib/transactionDisplay';
import api from '@/lib/api';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/lib/extractErrorMessage';
import { ChevronDown, Loader2, Tag } from 'lucide-react';
import type { Category, TransactionWithCategoryRead } from '@/types';

/**
 * El chip de categoría, editable en el sitio.
 *
 * Cambiar la categoría de un movimiento era abrir el modal de edición
 * completo -- monto, fecha, descripción, cuenta -- para tocar un solo campo.
 * Con la taxonomía nueva eso pasó de ser una molestia a ser el obstáculo
 * principal: reclasificar treinta movimientos eran treinta modales.
 *
 * Solo es editable lo que el backend acepta editar (`PATCH /transactions`):
 * ni canceladas, ni reversas, ni lo que generó el sistema. Ofrecer el selector
 * en una transferencia sería ofrecer un error.
 */

export function esCategoriaEditable(tx: TransactionWithCategoryRead): boolean {
  return (
    !tx.is_cancelled &&
    !tx.reversed_transaction_id &&
    !tx.source_type &&
    (tx.type === 'income' || tx.type === 'expense')
  );
}

type Props = {
  tx: TransactionWithCategoryRead;
  categories: Category[];
  /** Se llama tras guardar, para que la lista refresque. */
  onChanged?: () => void;
  className?: string;
};

export default function CategoryChipEditor({
  tx,
  categories,
  onChanged,
  className,
}: Props) {
  const [guardando, setGuardando] = useState(false);
  const editable = esCategoriaEditable(tx);

  const guardar = async (valor: string) => {
    const id = parseInt(valor, 10);
    if (!id || id === tx.category?.id) return;
    setGuardando(true);
    try {
      await api.patch(`/transactions/${tx.id}`, { category_id: id });
      const elegida = categories.find((c) => c.id === id);
      toast.success(
        elegida
          ? `Movimiento en «${categoryDisplayName(elegida, categories)}»`
          : 'Categoría actualizada',
      );
      onChanged?.();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setGuardando(false);
    }
  };

  const etiqueta = tx.category
    ? categoryDisplayName(tx.category, categories)
    : 'Sin categorizar';

  const chip = (
    <Badge
      className={cn(
        'border max-w-full',
        tx.category
          ? categoryBadgeClasses(tx)
          : 'bg-amber-50 text-amber-800 border-amber-300 border-dashed',
        editable && 'cursor-pointer transition-shadow hover:shadow-sm',
        className,
      )}
    >
      {!tx.category && <Tag className='mr-1 h-3 w-3 shrink-0' />}
      <span className='truncate'>{etiqueta}</span>
      {editable &&
        (guardando ? (
          <Loader2 className='ml-1 h-3 w-3 shrink-0 animate-spin' />
        ) : (
          <ChevronDown className='ml-0.5 h-3 w-3 shrink-0 opacity-60' />
        ))}
    </Badge>
  );

  if (!editable) return chip;

  return (
    <CategoryPicker
      categories={categories}
      value={tx.category ? String(tx.category.id) : ''}
      onChange={guardar}
      disabled={guardando}
      trigger={
        <button
          type='button'
          aria-label={`Categoría: ${etiqueta}. Pulsa para cambiarla`}
          className='max-w-full rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        >
          {chip}
        </button>
      }
    />
  );
}
