/**
 * Color e icono de una categoría.
 *
 * Dos decisiones que conviene no deshacer:
 *
 * 1. **El color se guarda como CLAVE de paleta, no como hex.** Un hex fijo no
 *    puede verse bien en tema claro y oscuro a la vez; acá cada clave se
 *    resuelve al tono que corresponde según el tema.
 *
 * 2. **Cuando no hay color, se deriva del NOMBRE, no de la posición.** Antes
 *    los gráficos hacían `TOKEN_COLORS[i % n]`, así que una categoría cambiaba
 *    de color de un mes a otro según su ranking de gasto y comparar dos
 *    períodos de un vistazo engañaba. Con un hash del nombre, "Transporte" es
 *    del mismo color siempre — también para las miles de categorías que ya
 *    existen sin color asignado.
 */

export const PALETTE_KEYS = [
  'sky', 'emerald', 'amber', 'rose', 'violet', 'teal', 'orange',
  'indigo', 'lime', 'pink', 'cyan', 'fuchsia', 'red', 'slate',
] as const;

export type PaletteKey = (typeof PALETTE_KEYS)[number];

/** Tonos elegidos para tener contraste suficiente sobre fondo claro y oscuro. */
const HEX: Record<PaletteKey, string> = {
  sky: '#0ea5e9',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  violet: '#8b5cf6',
  teal: '#14b8a6',
  orange: '#f97316',
  indigo: '#6366f1',
  lime: '#84cc16',
  pink: '#ec4899',
  cyan: '#06b6d4',
  fuchsia: '#d946ef',
  red: '#ef4444',
  slate: '#64748b',
};

/** Hash determinista (djb2). No necesita ser criptográfico: solo estable. */
function hashNombre(nombre: string): number {
  let h = 5381;
  for (let i = 0; i < nombre.length; i++) {
    h = ((h << 5) + h + nombre.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function esClaveValida(v: string | null | undefined): v is PaletteKey {
  return !!v && (PALETTE_KEYS as readonly string[]).includes(v);
}

/**
 * Color de una categoría. Usa el asignado si existe; si no, uno estable
 * derivado del nombre.
 */
export function categoryColor(
  categoria: { name: string; color?: string | null } | null | undefined,
): string {
  if (!categoria) return HEX.slate;
  if (esClaveValida(categoria.color)) return HEX[categoria.color];
  const clave = PALETTE_KEYS[hashNombre(categoria.name) % PALETTE_KEYS.length];
  return HEX[clave];
}

/** La clave (no el hex), para pintar chips con clases de Tailwind. */
export function categoryPaletteKey(
  categoria: { name: string; color?: string | null } | null | undefined,
): PaletteKey {
  if (!categoria) return 'slate';
  if (esClaveValida(categoria.color)) return categoria.color;
  return PALETTE_KEYS[hashNombre(categoria.name) % PALETTE_KEYS.length];
}
