import type { Category } from '@/types';

/**
 * Utilidades para la jerarquía de categorías (dos niveles).
 *
 * El backend ya devuelve la lista ordenada con cada hija junto a su padre y
 * con `parent_name` resuelto, así que acá no se vuelve a ordenar ni a cruzar
 * nada: solo se da forma a lo que los selectores necesitan.
 */

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
  T extends {
    id?: number;
    name: string;
    parent_id?: number | null;
    parent_name?: string | null;
    is_active?: boolean;
  },
>(c: T, todas: T[]): string {
  if (!c.parent_id) return c.name;

  // El grupo se BUSCA en el árbol; `parent_name` solo se usa de respaldo.
  // La categoría que viaja dentro de una transacción no lo trae (el backend
  // lo denormaliza únicamente en `GET /categories`), así que confiar en él
  // hacía que la lista de movimientos mostrara «General» en cada fila —
  // exactamente el nombre que el colapso existe para ocultar.
  const grupo = todas.find((x) => x.id != null && x.id === c.parent_id);
  const nombreGrupo = grupo?.name ?? c.parent_name ?? null;

  const hermanas = todas.filter((x) => x.parent_id === c.parent_id && x.is_active !== false);
  // Igual que en la lista: solo se funde con el grupo la hoja sintética.
  if (hermanas.length <= 1 && esHojaSintetica(c)) return nombreGrupo ?? c.name;
  return nombreGrupo ? `${nombreGrupo} › ${c.name}` : c.name;
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

/**
 * Filas que se pintan en la lista de categorías.
 *
 * El modelo tiene dos niveles siempre, pero mostrarlos siempre sería ruido:
 * quien creó «Mascotas» y nunca la desglosó vería «Mascotas» y debajo
 * «General», que no significa nada para él.
 *
 * - Grupo con UNA hoja  → una sola fila (`collapsed`). Las acciones son del
 *   grupo, que es lo que el usuario cree que está manipulando.
 * - Grupo con VARIAS    → fila del grupo (`group`) + una por hoja (`leaf`).
 *
 * Una hoja nunca aparece suelta: siempre bajo su grupo o fundida con él.
 */
/** Nombre de la hoja que el backend crea sola para que un grupo sea usable. */
export const HOJA_SINTETICA = 'General';

/**
 * ¿Esta hoja la puso el sistema o la puso el usuario?
 *
 * Solo se colapsa la sintética. Si alguien crea «Transporte › Gasolina» y esa
 * queda como única hoja, la lista DEBE mostrarla: colapsarla haría desaparecer
 * lo que el usuario acaba de crear. (Detectado en navegador, no por los tests.)
 *
 * Se reconoce por el nombre, que es como la crea el backend. Si alguien
 * bautiza una hoja «General» a propósito, se colapsa — lo cual es justo lo
 * que querría de todos modos.
 */
export function esHojaSintetica(c: { name: string }): boolean {
  return c.name === HOJA_SINTETICA;
}

export type CategoryRow =
  | { kind: 'collapsed'; group: Category; leaf: Category }
  | { kind: 'group'; group: Category; leafCount: number }
  | { kind: 'leaf'; group: Category; leaf: Category };

export function categoryRows(categories: Category[]): CategoryRow[] {
  const grupos = categories.filter((c) => !c.parent_id);
  const hojasPor = new Map<number, Category[]>();
  for (const c of categories) {
    if (!c.parent_id) continue;
    const lista = hojasPor.get(c.parent_id) ?? [];
    lista.push(c);
    hojasPor.set(c.parent_id, lista);
  }

  const filas: CategoryRow[] = [];
  for (const group of grupos) {
    const hojas = hojasPor.get(group.id) ?? [];
    if (hojas.length === 1 && esHojaSintetica(hojas[0])) {
      filas.push({ kind: 'collapsed', group, leaf: hojas[0] });
    } else {
      filas.push({ kind: 'group', group, leafCount: hojas.length });
      for (const leaf of hojas) filas.push({ kind: 'leaf', group, leaf });
    }
  }
  return filas;
}

/**
 * Secciones del selector de categoría.
 *
 * El orden importa más de lo que parece: en la cuenta real, las TRES
 * categorías más usadas concentran el 58% de los movimientos y las cinco
 * primeras el 74%. Ponerlas arriba resuelve tres de cada cuatro registros sin
 * que el usuario busque ni despliegue nada.
 *
 * Debajo, agrupadas por su grupo, para quien busca algo puntual.
 */
export type PickerSection = {
  /** null = sección «Frecuentes» */
  group: Category | null;
  label: string;
  options: Category[];
  /**
   * El grupo tiene una sola hoja y es la sintética: se ofrece como UNA opción
   * con el nombre del grupo y sin cabecera propia.
   *
   * Sin esto, una cuenta recién creada (donde todos los grupos son así) abría
   * el selector con trece cabeceras, cada una con una única opción llamada
   * «General» — trece opciones indistinguibles para elegir entre trece
   * categorías distintas. Es el mismo colapso que hace `categoryRows` en la
   * lista de Categorías, y tiene que coincidir con ella o la app se
   * contradice a sí misma.
   */
  collapsed?: boolean;
};

function normaliza(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function buildPickerSections(
  categories: Category[],
  query: string,
  frequentCount = 5,
): PickerSection[] {
  const hojas = postableCategories(categories).filter((c) => c.is_active);
  const grupos = new Map(categories.filter((c) => !c.parent_id).map((g) => [g.id, g]));

  const q = normaliza(query.trim());
  const coincide = (c: Category) => {
    if (!q) return true;
    const grupo = c.parent_id ? grupos.get(c.parent_id) : undefined;
    // Buscar «transporte» debe encontrar sus hojas, no solo las que se
    // llamen así: el usuario piensa en la categoría, no en la subcategoría.
    return normaliza(`${grupo?.name ?? ''} ${c.name}`).includes(q);
  };

  const visibles = hojas.filter(coincide);
  const secciones: PickerSection[] = [];

  if (!q) {
    const frecuentes = [...visibles]
      .filter((c) => (c.transactions_count ?? 0) > 0)
      .sort((a, b) => (b.transactions_count ?? 0) - (a.transactions_count ?? 0))
      .slice(0, frequentCount);
    if (frecuentes.length > 0) {
      secciones.push({ group: null, label: 'Frecuentes', options: frecuentes });
    }
  }

  // El resto, por grupo, en el orden en que vienen (el backend ya los ordena).
  const porGrupo = new Map<number, Category[]>();
  for (const c of visibles) {
    if (!c.parent_id) continue;
    const lista = porGrupo.get(c.parent_id) ?? [];
    lista.push(c);
    porGrupo.set(c.parent_id, lista);
  }
  for (const [gid, opciones] of porGrupo) {
    const grupo = grupos.get(gid);
    if (!grupo) continue;
    // Ojo: se mira cuántas hojas tiene el GRUPO, no cuántas sobrevivieron al
    // filtro de búsqueda. Si no, buscar «gasolina» en un Transporte con dos
    // hojas dejaría una sola visible y la pintaría como si fuera el grupo
    // entero — el usuario elegiría «Transporte» creyendo que eligió la hoja.
    const todasSusHojas = hojas.filter((h) => h.parent_id === gid);
    const collapsed =
      todasSusHojas.length === 1 && esHojaSintetica(todasSusHojas[0]);
    secciones.push({
      group: grupo,
      label: grupo.name,
      options: opciones,
      collapsed,
    });
  }

  return secciones;
}

/** Todas las opciones en orden de pantalla, para navegar con el teclado. */
export function flattenSections(secciones: PickerSection[]): Category[] {
  return secciones.flatMap((s) => s.options);
}
