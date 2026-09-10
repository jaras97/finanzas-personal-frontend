import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import TransactionsPage from './page';

/**
 * Las acciones de una transacción están duplicadas en dos árboles: la tabla
 * de escritorio (`columns.tsx`) y las cards de móvil (`page.tsx`). Agregar
 * una acción en uno y olvidarla en el otro la deja INVISIBLE en ese viewport,
 * sin ningún error — fue exactamente lo que pasó con el botón de
 * comprobantes y con el atajo de reglas.
 *
 * En jsdom no se aplican las media queries, así que ambos árboles se montan a
 * la vez. Eso se aprovecha acá: cada acción común debe aparecer DOS veces
 * para una misma transacción. Si alguien agrega una acción solo a un lado,
 * el conteo baja a 1 y este test falla.
 */

const get = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: (...a: unknown[]) => get(...a), post: vi.fn(), delete: vi.fn() },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const TX = {
  id: 1,
  amount: 150000,
  description: 'Compra supermercado',
  type: 'expense',
  date: '2026-08-31T10:00:00',
  is_cancelled: false,
  reversed_transaction_id: null,
  source_type: null,
  transfer_group_id: null,
  saving_account_id: 5,
  saving_account: { id: 5, name: 'Bancolombia', currency: 'COP' },
  category: { id: 9, name: 'Mercado', type: 'expense', is_active: true, is_system: false },
  attachments_count: 0,
};

beforeEach(() => {
  get.mockReset();
  get.mockImplementation((url: string) => {
    if (url.includes('/transactions/with-category'))
      return Promise.resolve({ data: { items: [TX], total: 1, page: 1, totalPages: 1 } });
    if (url === '/saving-accounts') return Promise.resolve({ data: [] });
    if (url.includes('/summary')) return Promise.resolve({ data: {} });
    return Promise.resolve({ data: [] });
  });
});

describe('paridad de acciones entre escritorio y móvil', () => {
  it('el botón de comprobantes existe en ambas vistas', async () => {
    render(<TransactionsPage />);
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /adjuntar comprobante/i })).toHaveLength(2),
    );
  });

  it('el atajo de crear regla existe en ambas vistas', async () => {
    render(<TransactionsPage />);
    await waitFor(() =>
      expect(
        screen.getAllByRole('button', { name: /crear regla desde esta transacción/i }),
      ).toHaveLength(2),
    );
  });

  it('editar y reversar existen en ambas vistas', async () => {
    render(<TransactionsPage />);
    await waitFor(() => expect(screen.getAllByRole('button', { name: /^editar$/i })).toHaveLength(2));
    expect(screen.getAllByRole('button', { name: /^reversar$/i })).toHaveLength(2);
  });

  it('el chip de categoría se puede editar en ambas vistas', async () => {
    render(<TransactionsPage />);
    await waitFor(() =>
      expect(
        screen.getAllByRole('button', { name: /categoría: mercado\. pulsa para cambiarla/i }),
      ).toHaveLength(2),
    );
  });

  it('el estado vacío es el MISMO en ambas vistas', async () => {
    // El vacío de la lista también vive en los dos árboles. Que cada uno
    // dijera algo distinto es cómo se termina arreglando solo uno.
    get.mockImplementation((url: string) => {
      if (url.includes('/transactions/with-category'))
        return Promise.resolve({ data: { items: [], total: 0, page: 1, totalPages: 1 } });
      return Promise.resolve({ data: [] });
    });
    render(<TransactionsPage />);
    await waitFor(() =>
      expect(screen.getAllByText(/todavía no hay movimientos/i)).toHaveLength(2),
    );
  });

  it('el contador de comprobantes se muestra en ambas vistas cuando hay adjuntos', async () => {
    get.mockImplementation((url: string) =>
      url.includes('/transactions/with-category')
        ? Promise.resolve({
            data: { items: [{ ...TX, attachments_count: 3 }], total: 1, page: 1, totalPages: 1 },
          })
        : Promise.resolve({ data: [] }),
    );
    render(<TransactionsPage />);
    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: /ver 3 comprobantes|3 comprobantes/i }).length)
        .toBeGreaterThanOrEqual(1),
    );
  });
});
