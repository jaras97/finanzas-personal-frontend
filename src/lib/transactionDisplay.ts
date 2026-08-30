import { TransactionWithCategoryRead } from '@/types';

// Aux: el campo `type` típico en tus transacciones
export type TxType = TransactionWithCategoryRead['type'] | 'transfer';

// Aux: categoría que podría venir con marcas de sistema
type SystemishCategory = {
  name?: string;
  is_system?: boolean;
  origin?: string;
};

export const typeColor = (type: TxType): string =>
  type === 'income'
    ? 'text-emerald-600'
    : type === 'expense'
    ? 'text-rose-600'
    : 'text-primary';

export const isCreditCardPurchase = (tx: TransactionWithCategoryRead): boolean =>
  tx.source_type === 'credit_card_purchase';

export const getTxCurrency = (tx: TransactionWithCategoryRead): string =>
  tx.saving_account?.currency ?? tx.debt?.currency ?? '';

export const getStatusLabel = (tx: TransactionWithCategoryRead): string => {
  if (tx.is_cancelled) return 'Reversada';
  if (tx.reversed_transaction_id) return 'Reversa';
  if (isCreditCardPurchase(tx)) return 'Compra con tarjeta';
  if (tx.type === 'income') return 'Ingreso';
  if (tx.type === 'expense') return 'Egreso';
  return 'Transferencia';
};

/** Paleta para categorías de sistema (ajusta nombres si cambian en tu seed) */
const SYSTEM_CATEGORY_STYLES: Record<string, string> = {
  Transferencia: 'bg-sky-50 text-sky-700 border-sky-200',
  'Pago de deuda': 'bg-amber-50 text-amber-700 border-amber-200',
  Comisión: 'bg-rose-50 text-rose-700 border-rose-200',
  Interés: 'bg-violet-50 text-violet-700 border-violet-200',
  Ajuste: 'bg-slate-50 text-slate-700 border-slate-200',
};

export function categoryBadgeClasses(tx: TransactionWithCategoryRead): string {
  const cat = tx.category as SystemishCategory | undefined;
  if (!cat) return '';

  const isSystem = cat.is_system === true || cat.origin === 'system';
  if (isSystem) {
    const key = cat.name ?? '';
    return (
      SYSTEM_CATEGORY_STYLES[key] ??
      'bg-slate-50 text-slate-700 border-slate-200'
    );
  }

  // Categorías de usuario: verde pastel ingresos, rojo pastel egresos
  if (tx.type === 'income') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (tx.type === 'expense') {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  return 'bg-slate-50 text-slate-700 border-slate-200';
}
