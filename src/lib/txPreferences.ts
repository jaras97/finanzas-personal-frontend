'use client';

/**
 * Recuerda las últimas selecciones al registrar una transacción, para no
 * obligar a rearmar el mismo formulario cada vez (la queja más concreta de
 * uso: "ingresar información toma muchos pasos").
 *
 * Vive en localStorage a propósito: es una conveniencia por dispositivo, no
 * un dato del dominio. Si no está disponible (modo privado, storage
 * bloqueado) todo sigue funcionando, solo que sin memoria -- por eso cada
 * acceso va envuelto en try/catch y devuelve null en vez de propagar.
 */

const KEY = 'tx:lastUsed';

export type TxType = 'income' | 'expense';

export type TxPreferences = {
  type?: TxType;
  /** accountId por tipo: la cuenta con la que sueles gastar rara vez es la
   *  misma con la que recibes ingresos. */
  accountByType?: Partial<Record<TxType, string>>;
  categoryByType?: Partial<Record<TxType, string>>;
};

export function readTxPreferences(): TxPreferences {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function writeTxPreferences(next: TxPreferences): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Sin storage disponible: seguimos sin memoria, no es un error de usuario.
  }
}

export function rememberTx(params: {
  type: TxType;
  accountId: string;
  categoryId: string;
}): void {
  const prev = readTxPreferences();
  writeTxPreferences({
    type: params.type,
    accountByType: { ...prev.accountByType, [params.type]: params.accountId },
    categoryByType: { ...prev.categoryByType, [params.type]: params.categoryId },
  });
}
