import { DateTime } from "luxon";

/**
 * Formatea fechas de "día lógico" para gráficos sin aplicar conversión de zona.
 * - Si es YYYY-MM-DD → no cambia zona, solo formatea.
 * - Si trae hora/offset → asume UTC y convierte a zona del navegador.
 */
export function formatDayLabel(input: string, fmt = "dd/MM"): string {
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(input);
  if (isDateOnly) {
    // Día lógico: no hagas setZone a local para evitar off-by-one
    return DateTime.fromISO(input).toFormat(fmt);
  }
  // Si trae hora/offset, entonces sí conviertes de UTC → zona del navegador
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return DateTime.fromISO(input, { zone: "utc" }).setZone(tz).toFormat(fmt);
}
