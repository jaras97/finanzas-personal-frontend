import { currencyType } from "@/types";

/**
 * Formatea un monto con el símbolo y los decimales correctos de su moneda
 * (vía Intl, que ya conoce esto para cualquier código ISO-4217 -- JPY sin
 * decimales, COP/USD/EUR con 2, etc.; COP los lleva porque ISO-4217 le
 * asigna 2 decimales, aunque en la práctica nadie use centavos de peso). Antes esto era un mapa manual de solo
 * dos símbolos, ambos mostrados como "$" plano y siempre sin decimales
 * (ocultaba los centavos en USD/EUR). `decimalDigits` permite forzar un
 * valor puntual si hace falta; por defecto se deja que Intl decida.
 */
export function formatCurrency(
  amount: number,
  currency: currencyType = "COP",
  decimalDigits?: number
): string {
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      minimumFractionDigits: decimalDigits,
      maximumFractionDigits: decimalDigits,
    }).format(amount);
  } catch {
    // Código de moneda no reconocido por Intl (no debería pasar con los
    // códigos ISO-4217 reales que sirve el backend).
    return `${currency} ${amount.toLocaleString("es-CO")}`;
  }
}
