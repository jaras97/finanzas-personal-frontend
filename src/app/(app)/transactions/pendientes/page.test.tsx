import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PendientesPage from './page';

/**
 * La bandeja de clasificación.
 *
 * Lo que se prueba es la parte que no se ve al mirar la pantalla: que la
 * operación masiva mande exactamente los ids seleccionados (ni uno más), y
 * que una respuesta parcial del servidor -- unos aplicados, otros no -- se
 * traduzca en la lista correcta en pantalla en vez de en un "algo falló".
 */

const get = vi.fn();
const patch = vi.fn();
vi.mock('@/lib/api', () => ({
  default: {
    get: (...a: unknown[]) => get(...a),
    patch: (...a: unknown[]) => patch(...a),
  },
}));
const toastSuccess = vi.fn();
const toastWarning = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (m: string) => toastSuccess(m),
    error: vi.fn(),
    warning: (m: string) => toastWarning(m),
  },
}));
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock('next/navigation', () => ({ usePathname: () => '/transactions/pendientes' }));

const CATEGORIAS = [
  { id: 1, name: 'Alimentación', type: 'expense', is_active: true, is_system: false, parent_id: null },
  { id: 2, name: 'Mercado', type: 'expense', is_active: true, is_system: false, parent_id: 1 },
  { id: 3, name: 'Restaurantes', type: 'expense', is_active: true, is_system: false, parent_id: 1 },
];

const tx = (id: number, description: string, type = 'expense') => ({
  id,
  amount: 10000 * id,
  description,
  type,
  date: '2026-09-01T10:00:00',
  is_cancelled: false,
  reversed_transaction_id: null,
  source_type: null,
  saving_account_id: 1,
  saving_account: { id: 1, name: 'Bancolombia', currency: 'COP' },
  category: null,
});

const ITEMS = [tx(1, 'Éxito'), tx(2, 'Panadería'), tx(3, 'Nómina', 'income')];

beforeEach(() => {
  get.mockReset();
  patch.mockReset();
  toastSuccess.mockReset();
  toastWarning.mockReset();
  get.mockImplementation((url: string) => {
    if (url.includes('/transactions/with-category'))
      return Promise.resolve({
        data: { items: ITEMS, total: 3, page: 1, totalPages: 1 },
      });
    if (url === '/categories') return Promise.resolve({ data: CATEGORIAS });
    if (url.includes('uncategorized/count'))
      return Promise.resolve({ data: { count: 3 } });
    return Promise.resolve({ data: [] });
  });
});

const marcar = async (nombre: RegExp) =>
  userEvent.click(await screen.findByRole('checkbox', { name: nombre }));

describe('bandeja de pendientes', () => {
  it('pide solo los movimientos sin clasificar', async () => {
    render(<PendientesPage />);
    await screen.findByText('Éxito');
    const llamada = get.mock.calls.find((c) =>
      String(c[0]).includes('/transactions/with-category'),
    );
    expect(llamada?.[1]?.params).toMatchObject({ uncategorized: true });
  });

  it('la barra de acción masiva solo aparece con algo seleccionado', async () => {
    render(<PendientesPage />);
    await screen.findByText('Éxito');
    expect(screen.queryByRole('button', { name: /^asignar$/i })).toBeNull();

    await marcar(/seleccionar Éxito/i);
    expect(screen.getByRole('button', { name: /^asignar$/i })).toBeInTheDocument();
  });

  it('manda exactamente los ids marcados', async () => {
    patch.mockResolvedValue({ data: { updated: 2, skipped: [] } });
    render(<PendientesPage />);
    await screen.findByText('Éxito');

    await marcar(/seleccionar Éxito/i);
    await marcar(/seleccionar Panadería/i);

    await userEvent.click(screen.getByRole('combobox', { name: /asignar a…/i }));
    await userEvent.click(await screen.findByRole('button', { name: 'Mercado' }));
    await userEvent.click(screen.getByRole('button', { name: /^asignar$/i }));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('/transactions/bulk-category', {
        transaction_ids: [1, 2],
        category_id: 2,
      }),
    );
    // La tercera fila no estaba marcada y sigue en pantalla.
    expect(screen.getByText('Nómina')).toBeInTheDocument();
  });

  it('«seleccionar todos» marca la página entera', async () => {
    patch.mockResolvedValue({ data: { updated: 3, skipped: [] } });
    render(<PendientesPage />);
    await screen.findByText('Éxito');

    await userEvent.click(
      screen.getByRole('checkbox', { name: /seleccionar todos los de esta página/i }),
    );
    // Dos veces: la cabecera de la lista y la barra de acción. Que digan lo
    // mismo es justamente lo que se comprueba.
    expect(screen.getAllByText('3 seleccionados')).toHaveLength(2);
  });

  it('una respuesta parcial deja en la lista justo lo que no se aplicó', async () => {
    // El servidor acepta los dos gastos y rechaza el ingreso: una categoría de
    // egreso no admite ingresos. La fila rechazada NO puede desaparecer.
    patch.mockResolvedValue({
      data: {
        updated: 2,
        skipped: [{ id: 3, reason: '«Mercado» no admite ingresos' }],
      },
    });
    render(<PendientesPage />);
    await screen.findByText('Éxito');

    await userEvent.click(
      screen.getByRole('checkbox', { name: /seleccionar todos los de esta página/i }),
    );
    await userEvent.click(screen.getByRole('combobox', { name: /asignar a…/i }));
    await userEvent.click(await screen.findByRole('button', { name: 'Mercado' }));
    await userEvent.click(screen.getByRole('button', { name: /^asignar$/i }));

    await waitFor(() => expect(toastWarning).toHaveBeenCalled());
    // El motivo concreto, no un genérico.
    expect(toastWarning.mock.calls[0][0]).toMatch(/no admite ingresos/);

    await waitFor(() => expect(screen.queryByText('Éxito')).toBeNull(), {
      timeout: 2000,
    });
    expect(screen.getByText('Nómina')).toBeInTheDocument();
  });

  it('clasificar una sola fila la retira sin tocar las demás', async () => {
    patch.mockResolvedValue({ data: {} });
    render(<PendientesPage />);
    await screen.findByText('Éxito');

    const selectores = screen.getAllByRole('combobox');
    await userEvent.click(selectores[0]);
    await userEvent.click(await screen.findByRole('button', { name: 'Restaurantes' }));

    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('/transactions/1', { category_id: 3 }),
    );
    await waitFor(() => expect(screen.queryByText('Éxito')).toBeNull(), {
      timeout: 2000,
    });
    expect(screen.getByText('Panadería')).toBeInTheDocument();
  });

  it('sin pendientes enseña el estado vacío, no una tabla en blanco', async () => {
    get.mockImplementation((url: string) => {
      if (url.includes('/transactions/with-category'))
        return Promise.resolve({ data: { items: [], total: 0, page: 1, totalPages: 1 } });
      if (url === '/categories') return Promise.resolve({ data: CATEGORIAS });
      return Promise.resolve({ data: { count: 0 } });
    });
    render(<PendientesPage />);
    expect(await screen.findByText(/no queda nada por clasificar/i)).toBeInTheDocument();
  });
});
