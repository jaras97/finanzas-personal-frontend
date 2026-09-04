import { describe, it, expect } from 'vitest';
import { categoryColor, categoryPaletteKey, PALETTE_KEYS } from './categoryStyle';

describe('color de categoría', () => {
  it('usa el color asignado cuando lo hay', () => {
    expect(categoryPaletteKey({ name: 'Vivienda', color: 'indigo' })).toBe('indigo');
  });

  it('es estable para el mismo nombre sin color', () => {
    // El bug que esto arregla: el color dependía de la POSICIÓN en la lista,
    // así que una categoría cambiaba de color entre un mes y otro.
    const a = categoryColor({ name: 'Transporte', color: null });
    const b = categoryColor({ name: 'Transporte' });
    expect(a).toBe(b);
  });

  it('da colores distintos a nombres distintos', () => {
    const nombres = ['Transporte', 'Vivienda', 'Ocio', 'Salud', 'Mercado'];
    const colores = new Set(nombres.map((name) => categoryColor({ name })));
    // No exigimos que TODOS difieran (la paleta cicla), pero sí que no colapsen
    expect(colores.size).toBeGreaterThan(2);
  });

  it('ignora un color que no esté en la paleta', () => {
    // Un hex guardado por error no debe pintarse: se cae al derivado del nombre
    const conBasura = categoryColor({ name: 'Transporte', color: '#ff0000' });
    const sinColor = categoryColor({ name: 'Transporte' });
    expect(conBasura).toBe(sinColor);
  });

  it('siempre devuelve un color de la paleta', () => {
    for (const n of ['a', 'Zzz', 'Ñoño', '', '12345']) {
      expect(PALETTE_KEYS).toContain(categoryPaletteKey({ name: n }));
    }
  });

  it('tolera una categoría ausente', () => {
    expect(categoryColor(null)).toBeTruthy();
    expect(categoryPaletteKey(undefined)).toBe('slate');
  });
});
