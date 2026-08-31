import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // `vite-tsconfig-paths` hace que el alias `@/...` de tsconfig funcione en
  // los tests sin duplicar la lista de rutas acá.
  plugins: [tsconfigPaths(), react()],
  // Los tests no renderizan estilos reales: sin este override, Vite intenta
  // cargar el PostCSS de Tailwind v4 y falla al parsearlo.
  css: { postcss: { plugins: [] } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Solo `src`: sin esto Vitest intentaría recorrer `.next/` y `node_modules`.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/middleware.ts'],
    },
  },
});
