import type { TaxonomyBlock, TaxonomyItem } from '@/types';

/**
 * Cálculo del diff del selector de categorías.
 *
 * Vive aparte del componente porque es la pieza que le dice al usuario qué va
 * a pasar ANTES de escribir nada: si esto miente, el selector vuelve a ser el
 * botón que creaba doce categorías a ciegas.
 */

export type Diff = {
  create: string[];
  reactivate: string[];
  deactivate: string[];
  /** Marcadas para quitar pero con movimientos: no se pueden tocar. */
  blocked: TaxonomyItem[];
  unchanged: number;
};

export function flattenTaxonomy(blocks: TaxonomyBlock[]): TaxonomyItem[] {
  return blocks.flatMap((b) => b.items.flatMap((i) => [i, ...i.children]));
}

/** Claves que ya están activas: el estado inicial del selector. */
export function initialSelection(blocks: TaxonomyBlock[]): Set<string> {
  return new Set(
    flattenTaxonomy(blocks)
      .filter((i) => i.state === 'present')
      .map((i) => i.key),
  );
}

export function computeDiff(
  blocks: TaxonomyBlock[],
  selected: Set<string>,
): Diff {
  const create: string[] = [];
  const reactivate: string[] = [];
  const deactivate: string[] = [];
  const blocked: TaxonomyItem[] = [];
  let unchanged = 0;

  for (const item of flattenTaxonomy(blocks)) {
    const marcada = selected.has(item.key);
    if (marcada) {
      if (item.state === 'absent') create.push(item.key);
      else if (item.state === 'inactive') reactivate.push(item.key);
      else unchanged++;
    } else {
      if (item.state === 'present') {
        // Con movimientos el backend la va a rechazar; se avisa acá para que
        // el usuario no descubra el bloqueo después de pulsar.
        if (item.locked) blocked.push(item);
        else deactivate.push(item.key);
      }
    }
  }

  return { create, reactivate, deactivate, blocked, unchanged };
}

export function hasChanges(d: Diff): boolean {
  return d.create.length + d.reactivate.length + d.deactivate.length > 0;
}

/**
 * Marcar una hija exige a su padre: sin él la hija no tiene dónde colgarse y
 * el backend la omitiría. Se resuelve al marcar, no al enviar, para que el
 * usuario vea el efecto en el momento.
 */
export function selectWithParent(
  blocks: TaxonomyBlock[],
  selected: Set<string>,
  key: string,
  marcar: boolean,
): Set<string> {
  const siguiente = new Set(selected);
  const padres = blocks.flatMap((b) => b.items);
  const padre = padres.find((p) => p.children.some((c) => c.key === key));

  if (marcar) {
    siguiente.add(key);
    if (padre) siguiente.add(padre.key);
  } else {
    siguiente.delete(key);
    // Desmarcar un padre arrastra a sus hijas: quedarían huérfanas.
    const esPadre = padres.find((p) => p.key === key);
    if (esPadre) for (const h of esPadre.children) siguiente.delete(h.key);
  }
  return siguiente;
}
