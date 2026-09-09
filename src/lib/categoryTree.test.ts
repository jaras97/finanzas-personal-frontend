import { describe, it, expect } from 'vitest';
import {
  categoryLabel, categoryDisplayName, categoryRows, groupCategories, possibleParents, postableCategories,
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

describe('filas de la lista de categorías', () => {
  const mascotas = cat({ id: 1, name: 'Mascotas' });
  const general = cat({ id: 10, name: 'General', parent_id: 1, parent_name: 'Mascotas' });
  const transporte = cat({ id: 2, name: 'Transporte' });
  const gasolina = cat({ id: 20, name: 'Gasolina', parent_id: 2, parent_name: 'Transporte' });
  const peajes = cat({ id: 21, name: 'Peajes', parent_id: 2, parent_name: 'Transporte' });

  it('un grupo de una sola hoja es UNA fila', () => {
    // Es lo que hace invisible el segundo nivel para quien no lo pidió
    const filas = categoryRows([mascotas, general]);
    expect(filas).toHaveLength(1);
    expect(filas[0].kind).toBe('collapsed');
  });

  it('un grupo con varias hojas se despliega', () => {
    const filas = categoryRows([transporte, gasolina, peajes]);
    expect(filas.map((f) => f.kind)).toEqual(['group', 'leaf', 'leaf']);
  });

  it('«General» nunca aparece como fila suelta', () => {
    const filas = categoryRows([mascotas, general, transporte, gasolina, peajes]);
    const sueltas = filas.filter((f) => f.kind === 'leaf' && f.leaf.name === 'General');
    expect(sueltas).toEqual([]);
  });

  it('no pierde ninguna categoría', () => {
    const todas = [mascotas, general, transporte, gasolina, peajes];
    const filas = categoryRows(todas);
    const vistos = new Set<number>();
    for (const f of filas) {
      vistos.add(f.group.id);
      if (f.kind !== 'group') vistos.add(f.leaf.id);
    }
    expect(vistos.size).toBe(todas.length);
  });

  it('un grupo sin hojas no revienta', () => {
    // No debería ocurrir (I3), pero la lista no puede romperse por eso
    const filas = categoryRows([mascotas]);
    expect(filas.map((f) => f.kind)).toEqual(['group']);
  });
});


describe('el colapso solo esconde la hoja sintética', () => {
  const transporte = cat({ id: 2, name: 'Transporte' });
  // El usuario creó UNA subcategoría con nombre propio
  const gasolina = cat({ id: 20, name: 'Gasolina', parent_id: 2, parent_name: 'Transporte' });

  it('una hoja con nombre propio NO se colapsa aunque esté sola', () => {
    // Colapsarla haría desaparecer lo que el usuario acaba de crear
    const filas = categoryRows([transporte, gasolina]);
    expect(filas.map((f) => f.kind)).toEqual(['group', 'leaf']);
  });

  it('y en los selectores se muestra con su grupo', () => {
    expect(categoryDisplayName(gasolina, [transporte, gasolina])).toBe('Transporte › Gasolina');
  });

  it('la sintética sí se sigue colapsando', () => {
    const mascotas = cat({ id: 1, name: 'Mascotas' });
    const general = cat({ id: 10, name: 'General', parent_id: 1, parent_name: 'Mascotas' });
    expect(categoryRows([mascotas, general]).map((f) => f.kind)).toEqual(['collapsed']);
    expect(categoryDisplayName(general, [mascotas, general])).toBe('Mascotas');
  });
});
