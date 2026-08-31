import { describe, it, expect } from 'vitest';
import { formatCurrency } from './format';

/**
 * Se afirma sobre el COMPORTAMIENTO (cuántos decimales, que no lance, que
 * incluya la moneda), no sobre la cadena exacta: el formato de `Intl` varía
 * entre versiones de Node/ICU y un test pegado a la cadena literal se
 * rompería sin que nada esté mal en la app.
 */
// El locale es es-CO: el punto separa miles y la COMA los decimales. Contar
// "lo que va después del último separador" leería el punto de miles como
// decimal (US$ 1.235 daría 3).
const decimals = (s: string): number => {
  const i = s.lastIndexOf(',');
  return i === -1 ? 0 : s.slice(i + 1).replace(/\D/g, '').length;
};

describe('formatCurrency', () => {
  it('usa COP por defecto', () => {
    expect(formatCurrency(1000)).toBe(formatCurrency(1000, 'COP'));
  });

  // Los decimales los dicta ISO-4217 vía Intl, no la app: COP y USD llevan 2,
  // JPY ninguno. (COP los tiene aunque en la práctica nadie use centavos.)
  it('respeta los decimales que ISO-4217 asigna a cada moneda', () => {
    expect(decimals(formatCurrency(1234.56, 'COP'))).toBe(2);
    expect(decimals(formatCurrency(1234.56, 'USD'))).toBe(2);
    expect(decimals(formatCurrency(1234.56, 'JPY'))).toBe(0);
  });

  it('permite forzar los decimales cuando hace falta', () => {
    expect(decimals(formatCurrency(1234.5, 'COP', 0))).toBe(0);
    expect(decimals(formatCurrency(1234.56, 'USD', 0))).toBe(0);
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

  it('separa miles en montos grandes', () => {
    // 10 millones no puede quedar como "10000000" pegado.
    expect(formatCurrency(10_000_000, 'COP')).toMatch(/[.,\s]/);
  });
});
