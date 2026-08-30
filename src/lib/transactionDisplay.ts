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

export const isTransferLeg = (tx: TransactionWithCategoryRead): boolean =>
  tx.source_type === 'transfer';

export const getStatusLabel = (tx: TransactionWithCategoryRead): string => {
  if (tx.is_cancelled) return 'Reversada';
  if (tx.reversed_transaction_id) return 'Reversa';
  if (isCreditCardPurchase(tx)) return 'Compra con tarjeta';
  // `type` en una pata de transferencia siempre es 'income' o 'expense' (el
  // modelo no usa el valor 'transfer' del enum en la práctica) -- por eso
  // este chequeo tiene que ir antes, o nunca se alcanza.
  if (isTransferLeg(tx)) return 'Transferencia';
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

export type DisplayTransaction = TransactionWithCategoryRead & {
  /** Presente cuando esta fila representa un par de transferencia colapsado:
   *  esta es la pata de salida (expense), `_pairedWith` es la de entrada. */
  _pairedWith?: TransactionWithCategoryRead;
};

/**
 * Colapsa el par de una transferencia (pata de salida + pata de entrada,
 * unidas por `transfer_group_id`) en una sola fila para mostrar -- ver dos
 * ambas patas en una lista que por lo demás es puro ingreso/gasto real hace
 * que se lea como "gasté Y también gané", cuando es la misma plata cambiando
 * de cuenta.
 *
 * Si solo una de las dos patas está disponible en la lista que se recibe
 * (ej. cayeron en páginas distintas de la paginación), esa transferencia
 * simplemente no se fusiona y cada pata se muestra sola -- degradación
 * aceptable, no un error.
 */
export function mergeTransferPairs(
  transactions: TransactionWithCategoryRead[],
): DisplayTransaction[] {
  const legsByGroup = new Map<string, TransactionWithCategoryRead[]>();
  for (const tx of transactions) {
    if (!tx.transfer_group_id) continue;
    const arr = legsByGroup.get(tx.transfer_group_id) ?? [];
    arr.push(tx);
    legsByGroup.set(tx.transfer_group_id, arr);
  }

  const mergedGroupEmitted = new Set<string>();
  const result: DisplayTransaction[] = [];

  for (const tx of transactions) {
    const groupId = tx.transfer_group_id;
    const legs = groupId ? legsByGroup.get(groupId) : undefined;

    if (!groupId || !legs || legs.length !== 2) {
      result.push(tx);
      continue;
    }
    if (mergedGroupEmitted.has(groupId)) continue;
    mergedGroupEmitted.add(groupId);

    const outgoing = legs.find((t) => t.type === 'expense') ?? legs[0];
    const incoming = legs.find((t) => t.type === 'income') ?? legs[1];
    result.push({ ...outgoing, _pairedWith: incoming });
  }

  return result;
}

const DEFAULT_TRANSFER_DESCRIPTIONS = new Set([
  'Transferencia de salida',
  'Transferencia recibida',
]);

/** "Transferencia" genérico salvo que el usuario haya puesto su propia
 *  descripción al crearla (ej. "Pago arriendo") -- esa sí vale la pena mostrar. */
export function transferDisplayDescription(tx: TransactionWithCategoryRead): string {
  if (!tx.description || DEFAULT_TRANSFER_DESCRIPTIONS.has(tx.description)) {
    return 'Transferencia';
  }
  return tx.description;
}

/** Un solo monto si la transferencia fue en la misma moneda; ambos lados si
 *  cruzó monedas (fusionarlos en un solo número ahí sería incorrecto). */
export function transferAmountDisplay(
  outgoing: TransactionWithCategoryRead,
  incoming: TransactionWithCategoryRead,
): string {
  const fromCur = getTxCurrency(outgoing);
  const toCur = getTxCurrency(incoming);
  const fromAmt = outgoing.amount.toLocaleString();
  if (fromCur === toCur) return `${fromAmt} ${fromCur}`;
  return `${fromAmt} ${fromCur} → ${incoming.amount.toLocaleString()} ${toCur}`;
}

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
