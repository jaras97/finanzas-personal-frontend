import type { Category } from '@/types';

/**
 * Utilidades para la jerarquía de categorías (dos niveles).
 *
 * El backend ya devuelve la lista ordenada con cada hija junto a su padre y
 * con `parent_name` resuelto, así que acá no se vuelve a ordenar ni a cruzar
 * nada: solo se da forma a lo que los selectores necesitan.
 */

/**
 * Nombre para mostrar en una lista plana: "Transporte › Gasolina".
 *
 * Pide la forma mínima, no `Category` entero: varios formularios declaran su
 * propio tipo local reducido y exigirles el completo obligaría a refactorizar
 * seis archivos para mostrar un texto.
 */
export function categoryLabel(c: { name: string; parent_name?: string | null }): string {
  return c.parent_name ? `${c.parent_name} › ${c.name}` : c.name;
}

/**
 * Solo las HOJAS reciben movimientos: los grupos agrupan.
 *
 * Filtrar acá y no en cada formulario evita que un selector ofrezca un grupo
 * y el usuario descubra el problema recién al guardar, con un 400.
 */
export function postableCategories<T extends { parent_id?: number | null }>(
  categories: T[],
): T[] {
  return categories.filter((c) => !!c.parent_id);
}

/**
 * Cómo se llama una categoría de cara al usuario.
 *
 * Una hoja que es la ÚNICA de su grupo se muestra con el nombre del grupo:
 * quien creó «Mascotas» y nunca la desglosó no tiene por qué ver «General».
 * Ese colapso es lo que hace que el segundo nivel sea invisible para quien no
 * lo pidió. Con varias hojas sí se distingue: «Transporte › Gasolina».
 */
export function categoryDisplayName<
  T extends { name: string; parent_id?: number | null; parent_name?: string | null; is_active?: boolean },
>(c: T, todas: T[]): string {
  if (!c.parent_id) return c.name;
  const hermanas = todas.filter((x) => x.parent_id === c.parent_id && x.is_active !== false);
  if (hermanas.length <= 1) return c.parent_name ?? c.name;
  return categoryLabel(c);
}

export type CategoryGroup = { parent: Category; children: Category[] };

/**
 * Agrupa para un selector: cada padre con sus hijas.
 *
 * Un padre puede elegirse igual que una hija — alguien que anota "gasolina"
 * como "Transporte" a secas no debería verse obligado a bajar un nivel.
 */
export function groupCategories(categories: Category[]): CategoryGroup[] {
  const padres = categories.filter((c) => !c.parent_id);
  const porPadre = new Map<number, Category[]>();
  for (const c of categories) {
    if (!c.parent_id) continue;
    const lista = porPadre.get(c.parent_id) ?? [];
    lista.push(c);
    porPadre.set(c.parent_id, lista);
  }
  return padres.map((parent) => ({
    parent,
    children: porPadre.get(parent.id) ?? [],
  }));
}

/**
 * Padres válidos para colgar una categoría.
 *
 * Excluye: las de sistema (deben quedarse en el primer nivel), las que ya son
 * subcategorías (solo dos niveles), la propia categoría, y las de tipo
 * incompatible. Replica las reglas del backend para no ofrecer opciones que
 * él va a rechazar -- pero el backend sigue siendo quien valida.
 */
export function possibleParents(
  categories: Category[],
  tipo: Category['type'] | '',
  excluirId?: number,
): Category[] {
  const tieneHijas = new Set(categories.map((c) => c.parent_id).filter(Boolean));
  return categories.filter((c) => {
    if (c.is_system) return false;
    if (c.parent_id) return false;
    if (excluirId != null && c.id === excluirId) return false;
    // Una categoría con hijas no puede pasar a ser hija de otra
    if (excluirId != null && tieneHijas.has(excluirId)) return false;
    if (tipo && c.type !== 'both' && tipo !== 'both' && c.type !== tipo) return false;
    return true;
  });
}
