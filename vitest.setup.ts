import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Desmonta lo renderizado entre tests: sin esto, dos tests que rendericen el
// mismo componente se pisan y los queries encuentran duplicados.
afterEach(() => {
  cleanup();
});

/**
 * Polyfills que jsdom no implementa y que Radix (Dialog, Select, Popover) usa
 * al montar. Sin ellos los componentes lanzan al renderizar y el fallo se ve
 * como un error críptico dentro de node_modules, no como algo del test.
 */
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never;
}

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

if (!globalThis.matchMedia) {
  globalThis.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as never;
}
