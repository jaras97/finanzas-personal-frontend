import { describe, it, expect } from 'vitest';
import { formatCurrency } from './format';

/**
 * Estos tests son deliberadamente independientes del locale y de la versión
 * de ICU: no se afirma sobre la cadena exacta ni sobre cuál carácter separa
 * los decimales. Un primer intento comparaba "lo que va después de la última
 * coma" y pasaba en local (Node con ICU completo, `$ 1.234,56`) pero fallaba
 * en CI, donde `es-CO` puede resolverse distinto y el separador decimal pasa
 * a ser el punto.
 *
 * En su lugar se comprueba si los centavos SOBREVIVEN al formateo: con 2
 * decimales, 1234.56 conserva el "56"; con 0, se redondea a 1235 y el "56"
 * desaparece. Eso es cierto en cualquier locale.
 */
const conservaCentavos = (s: string) => s.includes('56');

describe('formatCurrency', () => {
  it('usa COP por defecto', () => {
    expect(formatCurrency(1000)).toBe(formatCurrency(1000, 'COP'));
  });

  // Solo se afirma sobre las monedas cuyo número de decimales es estable
  // entre versiones de CLDR. COP se omite a propósito: Node 22 lo formatea
  // sin decimales y Node 23 con dos, así que fijar una expectativa acá haría
  // que el test pasara o fallara según la máquina, sin que nada esté mal.
  it('respeta los decimales que cada moneda tiene asignados', () => {
    expect(conservaCentavos(formatCurrency(1234.56, 'USD'))).toBe(true);
    expect(conservaCentavos(formatCurrency(1234.56, 'JPY'))).toBe(false);
  });

  it('el default de COP varía según el runtime, pero forzarlo siempre manda', () => {
    expect(conservaCentavos(formatCurrency(1234.56, 'COP', 2))).toBe(true);
    expect(conservaCentavos(formatCurrency(1234.56, 'COP', 0))).toBe(false);
  });

  it('permite forzar los decimales cuando hace falta', () => {
    expect(conservaCentavos(formatCurrency(1234.56, 'USD', 0))).toBe(false);
  });

  it('no lanza con un código de moneda desconocido (cae a un formato simple)', () => {
    const out = formatCurrency(1000, 'XYZ');
    expect(typeof out).toBe('string');
    expect(out).toContain('XYZ');
  });

  it('conserva el signo de los montos negativos', () => {
    expect(formatCurrency(-5000, 'COP')).toMatch(/-|\(/);
  });

  it('formatea el cero sin romperse', () => {
    expect(formatCurrency(0, 'COP')).toContain('0');
  });

  it('agrupa los miles en montos grandes', () => {
    // Sea cual sea el separador, 10 millones no puede salir como un bloque
    // corrido de 8 dígitos.
    expect(formatCurrency(10_000_000, 'COP')).not.toContain('10000000');
  });
});
