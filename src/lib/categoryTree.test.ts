import { describe, it, expect } from 'vitest';
import {
  categoryDisplayName, categoryRows, groupCategories, possibleParents, postableCategories,
  buildPickerSections, flattenSections,
} from './categoryTree';
import type { Category } from '@/types';

const cat = (o: Partial<Category> & { id: number; name: string }): Category => ({
  type: 'expense', is_active: true, is_system: false, ...o,
});

const transporte = cat({ id: 1, name: 'Transporte' });
const gasolina = cat({ id: 2, name: 'Gasolina', parent_id: 1, parent_name: 'Transporte' });
const salario = cat({ id: 3, name: 'Salario', type: 'income' });
const transferencia = cat({ id: 4, name: 'Transferencia', type: 'both', is_system: true });

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

describe('nombre visible sin parent_name', () => {
  it('resuelve el grupo por parent_id cuando no viene denormalizado', () => {
    // Es el caso de la categoría embebida en una transacción: el backend solo
    // rellena `parent_name` en GET /categories. Sin esto, la lista de
    // movimientos mostraba «General» en todas las filas.
    const mascotas = cat({ id: 1, name: 'Mascotas' });
    const generalSinPadre = cat({ id: 10, name: 'General', parent_id: 1 });
    expect(categoryDisplayName(generalSinPadre, [mascotas, generalSinPadre]))
      .toBe('Mascotas');
  });

  it('también compone «Grupo › Hoja» sin parent_name', () => {
    const transporte = cat({ id: 1, name: 'Transporte' });
    const gas = cat({ id: 10, name: 'Gasolina', parent_id: 1 });
    const peajes = cat({ id: 11, name: 'Peajes', parent_id: 1 });
    expect(categoryDisplayName(gas, [transporte, gas, peajes]))
      .toBe('Transporte › Gasolina');
  });

  it('si el grupo no está en la lista, cae a parent_name', () => {
    const huerfana = cat({ id: 10, name: 'Gasolina', parent_id: 99, parent_name: 'Transporte' });
    expect(categoryDisplayName(huerfana, [huerfana])).toBe('Transporte › Gasolina');
  });
});

describe('secciones del selector', () => {
  const transporte = cat({ id: 1, name: 'Transporte' });
  const gasolina = cat({ id: 10, name: 'Gasolina', parent_id: 1, parent_name: 'Transporte', transactions_count: 40 });
  const peajes = cat({ id: 11, name: 'Peajes', parent_id: 1, parent_name: 'Transporte', transactions_count: 2 });
  const ocio = cat({ id: 2, name: 'Ocio' });
  const salidas = cat({ id: 20, name: 'Salidas', parent_id: 2, parent_name: 'Ocio', transactions_count: 90 });
  const todas = [transporte, gasolina, peajes, ocio, salidas];

  it('pone las más usadas arriba', () => {
    // Tres de cada cuatro registros se resuelven sin buscar nada
    const s = buildPickerSections(todas, '');
    expect(s[0].label).toBe('Frecuentes');
    expect(s[0].options.map((o) => o.name)).toEqual(['Salidas', 'Gasolina', 'Peajes']);
  });

  it('nunca ofrece un grupo: solo reciben las hojas', () => {
    const s = buildPickerSections(todas, '');
    const ofrecidas = flattenSections(s).map((o) => o.id);
    expect(ofrecidas).not.toContain(transporte.id);
    expect(ofrecidas).not.toContain(ocio.id);
  });

  it('buscar por el nombre del GRUPO encuentra sus hojas', () => {
    // El usuario piensa en «transporte», no en «gasolina»
    const s = buildPickerSections(todas, 'transporte');
    expect(flattenSections(s).map((o) => o.name).sort()).toEqual(['Gasolina', 'Peajes']);
  });

  it('la búsqueda ignora tildes y mayúsculas', () => {
    const conTilde = cat({ id: 30, name: 'Educación', parent_id: 2, parent_name: 'Ocio' });
    const s = buildPickerSections([...todas, conTilde], 'EDUCACION');
    expect(flattenSections(s).map((o) => o.name)).toEqual(['Educación']);
  });

  it('un grupo sin desglosar se ofrece como UNA opción con su nombre', () => {
    // El caso de una cuenta recién creada: cada grupo tiene solo la hoja
    // «General» que crea el backend. Sin colapsar, el selector abría con
    // trece cabeceras y trece opciones llamadas todas «General».
    const mascotas = cat({ id: 3, name: 'Mascotas' });
    const generalM = cat({ id: 30, name: 'General', parent_id: 3, parent_name: 'Mascotas' });
    const s = buildPickerSections([mascotas, generalM], '');

    expect(s).toHaveLength(1);
    expect(s[0].collapsed).toBe(true);
    expect(s[0].label).toBe('Mascotas');
    // La opción sigue siendo la HOJA: es la que recibe el movimiento.
    expect(s[0].options.map((o) => o.id)).toEqual([generalM.id]);
  });

  it('un grupo con hojas propias NO se colapsa', () => {
    const s = buildPickerSections(todas, '');
    const seccionTransporte = s.find((x) => x.group?.id === transporte.id);
    expect(seccionTransporte?.collapsed).toBe(false);
  });

  it('una hoja creada por el usuario, aunque sea la única, no se colapsa', () => {
    // Si alguien crea «Transporte › Gasolina» y esa queda como única hoja,
    // colapsarla haría desaparecer lo que acaba de crear.
    const t = cat({ id: 4, name: 'Transporte' });
    const g = cat({ id: 40, name: 'Gasolina', parent_id: 4, parent_name: 'Transporte' });
    const s = buildPickerSections([t, g], '');
    expect(s[0].collapsed).toBe(false);
    expect(s[0].label).toBe('Transporte');
  });

  it('filtrar hasta dejar una hoja no convierte el grupo en colapsado', () => {
    // Buscar «gasolina» deja una sola hoja visible de Transporte. Si eso
    // contara como colapsado, la opción se pintaría «Transporte» y el usuario
    // creería estar eligiendo el grupo entero.
    const s = buildPickerSections(todas, 'gasolina');
    const seccion = s.find((x) => x.group?.id === transporte.id);
    expect(seccion?.collapsed).toBe(false);
    expect(seccion?.options.map((o) => o.name)).toEqual(['Gasolina']);
  });

  it('al buscar no se muestran «Frecuentes»', () => {
    // Con una búsqueda activa el usuario ya dijo qué quiere: repetir las
    // frecuentes arriba solo añadiría ruido y duplicados.
    const s = buildPickerSections(todas, 'gas');
    expect(s.every((x) => x.label !== 'Frecuentes')).toBe(true);
  });

  it('las inactivas no se ofrecen', () => {
    const vieja = cat({ id: 40, name: 'Vieja', parent_id: 1, parent_name: 'Transporte', is_active: false });
    const s = buildPickerSections([...todas, vieja], '');
    expect(flattenSections(s).map((o) => o.name)).not.toContain('Vieja');
  });
});
