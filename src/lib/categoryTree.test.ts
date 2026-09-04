import { describe, it, expect } from 'vitest';
import { categoryLabel, groupCategories, possibleParents } from './categoryTree';
import type { Category } from '@/types';

const cat = (o: Partial<Category> & { id: number; name: string }): Category => ({
  type: 'expense', is_active: true, is_system: false, ...o,
});

const transporte = cat({ id: 1, name: 'Transporte' });
const gasolina = cat({ id: 2, name: 'Gasolina', parent_id: 1, parent_name: 'Transporte' });
const salario = cat({ id: 3, name: 'Salario', type: 'income' });
const transferencia = cat({ id: 4, name: 'Transferencia', type: 'both', is_system: true });

describe('etiqueta', () => {
  it('muestra el padre cuando es subcategoría', () => {
    expect(categoryLabel(gasolina)).toBe('Transporte › Gasolina');
    expect(categoryLabel(transporte)).toBe('Transporte');
  });
});

describe('agrupación', () => {
  it('cuelga cada hija de su padre', () => {
    const g = groupCategories([transporte, gasolina, salario]);
    expect(g.map((x) => x.parent.name)).toEqual(['Transporte', 'Salario']);
    expect(g[0].children.map((c) => c.name)).toEqual(['Gasolina']);
    expect(g[1].children).toEqual([]);
  });

  it('no pierde ninguna categoría', () => {
    const todas = [transporte, gasolina, salario, transferencia];
    const g = groupCategories(todas);
    const vistas = g.flatMap((x) => [x.parent, ...x.children]).length;
    expect(vistas).toBe(todas.length);
  });
});

describe('padres posibles', () => {
  const todas = [transporte, gasolina, salario, transferencia];

  it('excluye las de sistema y las que ya son subcategorías', () => {
    const p = possibleParents(todas, 'expense').map((c) => c.name);
    expect(p).toEqual(['Transporte']);
  });

  it('excluye la categoría misma', () => {
    expect(possibleParents(todas, 'expense', 1)).toEqual([]);
  });

  it('no ofrece un padre de otro tipo', () => {
    const p = possibleParents(todas, 'income').map((c) => c.name);
    expect(p).toEqual(['Salario']);
  });

  it('una categoría con hijas no puede colgarse de otra', () => {
    const otra = cat({ id: 5, name: 'Movilidad' });
    // id 1 (Transporte) tiene a Gasolina como hija
    expect(possibleParents([...todas, otra], 'expense', 1)).toEqual([]);
  });
});
