import { describe, it, expect } from 'vitest';
import {
  computeDiff, initialSelection, selectWithParent, hasChanges, flattenTaxonomy,
} from './taxonomyDiff';
import type { TaxonomyBlock, TaxonomyItem } from '@/types';

const item = (o: Partial<TaxonomyItem> & { key: string; name: string }): TaxonomyItem => ({
  type: 'expense', core: false, state: 'absent', transactions: 0,
  locked: false, children: [], ...o,
});

const bloques = (): TaxonomyBlock[] => [
  {
    id: 'fijos', label: 'Fijos',
    items: [
      item({
        key: 'transporte', name: 'Transporte', state: 'present', core: true,
        children: [
          item({ key: 'transporte/gasolina', name: 'Gasolina' }),
          item({ key: 'transporte/peajes', name: 'Peajes', state: 'inactive' }),
        ],
      }),
      item({
        key: 'vivienda', name: 'Vivienda', state: 'present', core: true,
        transactions: 12, locked: true, locked_reason: 'Tiene 12 movimientos',
      }),
      item({ key: 'mascotas', name: 'Mascotas' }),
    ],
  },
];

describe('selección inicial', () => {
  it('parte de lo que el usuario ya tiene activo', () => {
    expect([...initialSelection(bloques())].sort()).toEqual(['transporte', 'vivienda']);
  });
});

describe('diff', () => {
  it('sin tocar nada no hay cambios', () => {
    const d = computeDiff(bloques(), initialSelection(bloques()));
    expect(hasChanges(d)).toBe(false);
    expect(d.unchanged).toBe(2);
  });

  it('marcar una ausente la crea y una inactiva la reactiva', () => {
    const sel = new Set(['transporte', 'vivienda', 'transporte/gasolina', 'transporte/peajes']);
    const d = computeDiff(bloques(), sel);
    expect(d.create).toEqual(['transporte/gasolina']);
    expect(d.reactivate).toEqual(['transporte/peajes']);
  });

  it('desmarcar una sin movimientos la desactiva', () => {
    const d = computeDiff(bloques(), new Set(['vivienda']));
    expect(d.deactivate).toEqual(['transporte']);
  });

  it('una con movimientos aparece bloqueada, nunca en desactivar', () => {
    // La propiedad de seguridad: el usuario ve el bloqueo ANTES de pulsar.
    const d = computeDiff(bloques(), new Set([]));
    expect(d.deactivate).toEqual(['transporte']);
    expect(d.blocked.map((i) => i.name)).toEqual(['Vivienda']);
  });
});

describe('marcar con el padre', () => {
  it('marcar una hija arrastra a su padre', () => {
    const s = selectWithParent(bloques(), new Set(), 'transporte/gasolina', true);
    expect([...s].sort()).toEqual(['transporte', 'transporte/gasolina']);
  });

  it('desmarcar un padre arrastra a sus hijas', () => {
    const inicial = new Set(['transporte', 'transporte/gasolina', 'transporte/peajes']);
    const s = selectWithParent(bloques(), inicial, 'transporte', false);
    expect([...s]).toEqual([]);
  });

  it('desmarcar una hija no toca al padre', () => {
    const inicial = new Set(['transporte', 'transporte/gasolina']);
    const s = selectWithParent(bloques(), inicial, 'transporte/gasolina', false);
    expect([...s]).toEqual(['transporte']);
  });
});

describe('aplanado', () => {
  it('recorre padres e hijas sin perder ninguna', () => {
    expect(flattenTaxonomy(bloques()).length).toBe(5);
  });
});
