import { describe, it, expect } from 'vitest';
import {
  categoryLabel, categoryDisplayName, groupCategories, possibleParents, postableCategories,
} from './categoryTree';
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

describe('nombre visible (colapso del grupo de una hoja)', () => {
  const general = cat({ id: 10, name: 'General', parent_id: 1, parent_name: 'Mascotas' });
  const mascotas = cat({ id: 1, name: 'Mascotas' });

  it('una hoja única se muestra con el nombre de su grupo', () => {
    // Quien creó "Mascotas" y nunca la desglosó no tiene por qué ver "General"
    expect(categoryDisplayName(general, [mascotas, general])).toBe('Mascotas');
  });

  it('con hermanas sí se distingue', () => {
    const vet = cat({ id: 11, name: 'Veterinario', parent_id: 1, parent_name: 'Mascotas' });
    expect(categoryDisplayName(general, [mascotas, general, vet])).toBe('Mascotas › General');
    expect(categoryDisplayName(vet, [mascotas, general, vet])).toBe('Mascotas › Veterinario');
  });

  it('un grupo se muestra con su propio nombre', () => {
    expect(categoryDisplayName(mascotas, [mascotas, general])).toBe('Mascotas');
  });
});

describe('solo las hojas reciben movimientos', () => {
  it('los grupos quedan fuera del selector', () => {
    // Ofrecer un grupo haría que el usuario descubriera el problema al guardar
    const lista = [
      cat({ id: 1, name: 'Mascotas' }),
      cat({ id: 10, name: 'General', parent_id: 1, parent_name: 'Mascotas' }),
    ];
    expect(postableCategories(lista).map((c) => c.id)).toEqual([10]);
  });
});
