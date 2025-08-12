import { DateTime } from "luxon";

/**
 * Devuelve la zona horaria IANA del navegador (ej: "America/Bogota").
 */
export const getBrowserTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Convierte un Date o string a "YYYY-MM-DD" respetando la TZ del navegador.
 */
export function toIsoDateLocalTZ(
  input?: Date | string | null
): string | undefined {
  if (!input) return undefined;

  // Asegura "YYYY-MM-DD" como base (si viene Date, recortamos el ISO)
  const raw =
    input instanceof Date
      ? input.toISOString().slice(0, 10)
      : String(input).slice(0, 10);

  const date = DateTime.fromISO(raw, { zone: getBrowserTimeZone() }).toISODate();
  return date ?? undefined;
}

/**
 * Construye URLSearchParams con start_date / end_date (YYYY-MM-DD) más extras opcionales.
 * - Las fechas se interpretan en la TZ del navegador.
 * - Ignora strings vacíos y el valor "all".
 */
export function buildDateParams(
  start?: Date | string | null,
  end?: Date | string | null,
  extra?: Record<string, string | number | boolean | undefined | null>
) {
  const params = new URLSearchParams();

  const s = toIsoDateLocalTZ(start);
  const e = toIsoDateLocalTZ(end);

  if (s) params.set("start_date", s);
  if (e) params.set("end_date", e);

  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v === undefined || v === null) continue;
      if (typeof v === "string" && (v.trim() === "" || v === "all")) continue;
      params.set(k, String(v));
    }
  }

  return params;
}

/**
 * Azúcar para construir params desde un DateRange de react-day-picker.
 */
export function buildDateParamsFromRange(
  range: { from?: Date; to?: Date } | undefined,
  extra?: Record<string, string | number | boolean | undefined | null>
) {
  return buildDateParams(range?.from, range?.to, extra);
}

/* ========= Helpers para transacciones (límites del día local -> UTC ISO con hora) ========= */

/**
 * A partir de strings ISO (YYYY-MM-DD o ISO completo) calcula
 * los límites del día LOCAL y los devuelve en UTC ISO con hora.
 */
export function toUtcDayBoundsFromISOStrings(
  startISO?: string,
  endISO?: string,
  tz: string = getBrowserTimeZone()
) {
  const start = startISO
    ? DateTime.fromISO(startISO.slice(0, 10), { zone: tz })
        .startOf("day")
        .toUTC()
        .toISO()
    : undefined;

  const end = endISO
    ? DateTime.fromISO(endISO.slice(0, 10), { zone: tz })
        .endOf("day")
        .toUTC()
        .toISO()
    : undefined;

  return { start, end };
}

/**
 * Versión que acepta Date o string indistintamente y devuelve
 * los límites del día LOCAL en UTC ISO con hora.
 */
export function toUtcDayBounds(
  start?: Date | string | null,
  end?: Date | string | null,
  tz: string = getBrowserTimeZone()
) {
  const s = start
    ? start instanceof Date
      ? start.toISOString()
      : String(start)
    : undefined;
  const e = end
    ? end instanceof Date
      ? end.toISOString()
      : String(end)
    : undefined;

  return toUtcDayBoundsFromISOStrings(s, e, tz);
}

/**
 * Construye el objeto de params típico para /transactions/with-category,
 * aplicando los límites de día local -> UTC ISO con hora.
 */
export type TxType = "income" | "expense";
export type TxSource = "credit_card" | "account";

export interface TransactionQueryParams {
  page: number;
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  type?: TxType;
  source?: TxSource; // ya filtramos "all"
}

export function buildTxParams(
  options: {
    startDate?: string;
    endDate?: string;
    categoryId?: number;
    type?: TxType;
    source?: "all" | TxSource;
  } = {},
  page = 1
): TransactionQueryParams {
  const { start, end } = toUtcDayBoundsFromISOStrings(
    options.startDate,
    options.endDate
  );

  const params: TransactionQueryParams = { page };

  if (start) params.startDate = start;
  if (end) params.endDate = end;
  if (options.categoryId) params.categoryId = options.categoryId;
  if (options.type) params.type = options.type;
  if (options.source && options.source !== "all") params.source = options.source;

  return params;
}
