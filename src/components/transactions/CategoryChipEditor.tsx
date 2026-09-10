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
import { categoryIcon } from '@/lib/categoryIcon';
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

  // El icono de una hoja suele estar vacío: lo lleva el grupo, que es quien
  // tiene identidad visual. Sin este respaldo, casi todas las filas caerían
  // al icono genérico y el color sería lo único que distinguiría una de otra.
  const grupo = tx.category?.parent_id
    ? categories.find((c) => c.id === tx.category!.parent_id)
    : undefined;
  const Icono = tx.category
    ? categoryIcon(tx.category.icon ?? grupo?.icon)
    : Tag;

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
      {/* El icono de la categoría, no uno genérico: es lo que hace que la
          lista se lea de un vistazo sin tener que leer cada nombre. El mapa
          (`lib/categoryIcon`) ya existía y solo se usaba en Categorías y en
          el donut. */}
      <Icono className='mr-1 h-3 w-3 shrink-0' />
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
