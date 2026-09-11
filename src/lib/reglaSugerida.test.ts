import { describe, it, expect } from 'vitest';
import { patronDe, coincide, cuantosCubre } from './reglaSugerida';

describe('patronDe', () => {
  it('saca el comercio de una descripción de extracto', () => {
    expect(patronDe('RAPPI*BOGOTA 4471')).toBe('RAPPI');
    expect(patronDe('UBER  TRIP')).toBe('UBER');
  });

  it('salta las palabras genéricas de todo extracto', () => {
    // Una regla sobre «Cargo» clasificaría medio historial.
    expect(patronDe('Cargo Netflix mensual')).toBe('Netflix');
    expect(patronDe('PAGO PSE CLARO')).toBe('CLARO');
  });

  it('ignora referencias numéricas y alfanuméricas', () => {
    expect(patronDe('COMPRA 123456 EXITO')).toBe('EXITO');
    expect(patronDe('4471A EXITO')).toBe('EXITO');
  });

  it('conserva las tildes, porque el texto se usa tal cual como regla', () => {
    // Quitarlas produciría una regla que no coincide con su propia descripción.
    expect(patronDe('Compra en Éxito')).toBe('Éxito');
  });

  it('devuelve null cuando no hay nada que sirva de patrón', () => {
    expect(patronDe('PAGO COMPRA CARGO')).toBeNull();
    expect(patronDe('12 34')).toBeNull();
    expect(patronDe('')).toBeNull();
    expect(patronDe(null)).toBeNull();
  });
});

describe('coincide', () => {
  it('usa el mismo criterio del backend: contiene, sin distinguir mayúsculas', () => {
    expect(coincide('RAPPI*BOGOTA', 'rappi')).toBe(true);
    expect(coincide('rappi bogota', 'RAPPI')).toBe(true);
    expect(coincide('UBER TRIP', 'rappi')).toBe(false);
    expect(coincide(null, 'rappi')).toBe(false);
  });
});

describe('cuantosCubre', () => {
  const pendientes = [
    { id: 1, description: 'RAPPI*BOGOTA 4471' },
    { id: 2, description: 'RAPPI*MEDELLIN 998' },
    { id: 3, description: 'UBER TRIP' },
    { id: 4, description: null },
  ];

  it('cuenta los otros pendientes que la regla resolvería', () => {
    expect(cuantosCubre('RAPPI', pendientes, 1)).toBe(1);
    expect(cuantosCubre('RAPPI', pendientes)).toBe(2);
  });

  it('no cuenta la transacción que se acaba de clasificar', () => {
    // Si contara la propia, ofrecería una regla que ahorra cero clics.
    expect(cuantosCubre('UBER', pendientes, 3)).toBe(0);
  });
});
