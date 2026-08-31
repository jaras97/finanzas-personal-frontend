import { describe, it, expect } from 'vitest';
import { progressTone } from './budgetDisplay';

/**
 * Los cortes (80% ámbar, 100% rojo) son la única señal visual de que un
 * presupuesto se está saliendo de control, y se comparten entre la pestaña
 * /budgets y la sección de Resumen. Moverlos sin querer haría que ambas
 * pantallas mientan a la vez.
 */
describe('progressTone', () => {
  it('verde por debajo del 80%', () => {
    for (const p of [0, 1, 50, 79, 79.9]) {
      expect(progressTone(p).bar).toContain('emerald');
    }
  });

  it('ámbar entre 80% y 100%', () => {
    for (const p of [80, 90, 99.9]) {
      expect(progressTone(p).bar).toContain('amber');
    }
  });

  it('rojo al alcanzar o pasar el 100%', () => {
    for (const p of [100, 150, 1000]) {
      expect(progressTone(p).bar).toContain('rose');
    }
  });

  it('los bordes son inclusivos hacia arriba (80 ya es ámbar, 100 ya es rojo)', () => {
    expect(progressTone(79.99).bar).toContain('emerald');
    expect(progressTone(80).bar).toContain('amber');
    expect(progressTone(99.99).bar).toContain('amber');
    expect(progressTone(100).bar).toContain('rose');
  });

  it('el badge acompaña siempre al mismo color de la barra', () => {
    expect(progressTone(10).badge).toContain('emerald');
    expect(progressTone(85).badge).toContain('amber');
    expect(progressTone(120).badge).toContain('rose');
  });
});
