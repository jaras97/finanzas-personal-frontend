/**
 * Detectar el patrón repetido de una descripción bancaria, para poder ofrecer
 * la regla que cubriría los demás movimientos iguales.
 *
 * Vive en `lib/` y no en la bandeja para poder probarse sin montar React: es
 * una heurística, y una heurística sin tests envejece mal.
 *
 * El texto que se devuelve se usa tal cual como `match_text` de la regla, así
 * que **no se le quitan las tildes**: el backend compara «contiene» en
 * minúsculas sobre el texto original, y un patrón sin tildes no coincidiría
 * con la descripción de la que salió.
 */

/**
 * Palabras que aparecen en casi todo extracto bancario y no identifican al
 * comercio. Una regla sobre «PAGO» clasificaría medio historial.
 */
const GENERICAS = new Set([
  'pago',
  'pagos',
  'compra',
  'compras',
  'cargo',
  'cargos',
  'abono',
  'abonos',
  'debito',
  'credito',
  'transferencia',
  'transf',
  'retiro',
  'consignacion',
  'cta',
  'cuenta',
  'tarjeta',
  'tarj',
  'pse',
  'pos',
  'rec',
  'ref',
  'mensual',
  'nacional',
  'internacional',
  'sucursal',
  'oficina',
  'del',
  'los',
  'las',
  'por',
  'con',
  'para',
]);

const sinTildes = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Devuelve el fragmento que identifica al comercio, o `null` si la descripción
 * no da para una regla (solo palabras genéricas, números o texto muy corto).
 *
 * «RAPPI*BOGOTA 4471» → «RAPPI»; «Cargo Netflix mensual» → «Netflix».
 */
export function patronDe(descripcion: string | null | undefined): string | null {
  if (!descripcion) return null;

  // Cualquier cosa que no sea letra o número separa: los extractos usan `*`,
  // `-`, `/` y espacios indistintamente.
  const tokens = descripcion.split(/[^\p{L}\p{N}]+/u).filter(Boolean);

  for (const token of tokens) {
    if (token.length < 3) continue;
    if (/^\d+$/.test(token)) continue; // referencias, no comercios
    const normalizado = sinTildes(token).toLowerCase();
    if (GENERICAS.has(normalizado)) continue;
    // Un token alfanumérico mezclado ("4471A") suele ser referencia.
    if (/\d/.test(token) && /\p{L}/u.test(token)) continue;
    return token;
  }
  return null;
}

/** Aplica el mismo criterio del backend: «contiene», sin distinguir mayúsculas. */
export function coincide(descripcion: string | null | undefined, patron: string): boolean {
  if (!descripcion) return false;
  return descripcion.toLowerCase().includes(patron.toLowerCase());
}

/**
 * Cuántos de `otros` quedarían cubiertos por una regla sobre `patron`.
 *
 * Sirve para decidir si ofrecerla: proponer una regla que ahorra cero clics es
 * ruido, y a la tercera vez el usuario deja de leer los avisos.
 */
export function cuantosCubre(
  patron: string,
  otros: { id: number; description?: string | null }[],
  excluirId?: number,
): number {
  return otros.filter((t) => t.id !== excluirId && coincide(t.description, patron)).length;
}
