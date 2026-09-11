import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useCategories, _limpiarCacheCategorias } from './useCategories';

const get = vi.fn();
vi.mock('@/lib/api', () => ({ default: { get: (...a: unknown[]) => get(...a) } }));

const CATS = [
  { id: 1, name: 'Transporte', type: 'expense', is_active: true, is_system: false, parent_id: null },
  { id: 2, name: 'Gasolina', type: 'expense', is_active: true, is_system: false, parent_id: 1 },
];

/** Pinta lo que devuelve el hook, para poder afirmar sobre ello. */
function Sonda({ type, enabled }: { type?: 'income' | 'expense'; enabled?: boolean }) {
  const { categories, loading } = useCategories({ type, status: 'active', enabled });
  return (
    <div>
      <span data-testid='estado'>{loading ? 'cargando' : 'listo'}</span>
      <span data-testid='n'>{categories.length}</span>
    </div>
  );
}

beforeEach(() => {
  get.mockReset();
  get.mockResolvedValue({ data: CATS });
  _limpiarCacheCategorias();
});

describe('useCategories', () => {
  it('pide las categorías con los parámetros que recibe', async () => {
    render(<Sonda type='expense' />);
    await waitFor(() => expect(screen.getByTestId('n')).toHaveTextContent('2'));
    expect(get).toHaveBeenCalledWith('/categories', {
      params: { type: 'expense', status: 'active' },
    });
  });

  it('varias instancias con los mismos parámetros comparten UNA petición', async () => {
    // Es el motivo de existir de la caché: en /transactions hay tres
    // NewTransactionModal montados (escritorio, móvil y el FAB) más los filtros.
    render(
      <>
        <Sonda type='expense' />
        <Sonda type='expense' />
        <Sonda type='expense' />
      </>,
    );
    await waitFor(() =>
      expect(screen.getAllByTestId('n')[0]).toHaveTextContent('2'),
    );
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('parámetros distintos son peticiones distintas', async () => {
    render(
      <>
        <Sonda type='expense' />
        <Sonda type='income' />
      </>,
    );
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  });

  it('con enabled=false no pide nada', async () => {
    // Los modales viven montados y cerrados: sin esto, abrir la página pediría
    // las categorías de cada uno antes de que el usuario abra ninguno.
    render(<Sonda type='expense' enabled={false} />);
    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('listo'));
    expect(get).not.toHaveBeenCalled();
  });

  it('está «cargando» hasta que llega la respuesta de ESOS parámetros', async () => {
    // Sin esto hay un render con la lista vacía y loading ya en false, y quien
    // lo consuma concluye «no hay categorías» cuando aún no han llegado.
    let resolver: (v: unknown) => void = () => {};
    get.mockReturnValue(new Promise((r) => (resolver = r)));

    render(<Sonda type='expense' />);
    expect(screen.getByTestId('estado')).toHaveTextContent('cargando');
    expect(screen.getByTestId('n')).toHaveTextContent('0');

    resolver({ data: CATS });
    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('listo'));
    expect(screen.getByTestId('n')).toHaveTextContent('2');
  });

  it('un fallo no se cachea: el siguiente montaje reintenta', async () => {
    get.mockRejectedValueOnce(new Error('red caída'));
    const { unmount } = render(<Sonda type='expense' />);
    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent('listo'));
    expect(screen.getByTestId('n')).toHaveTextContent('0');
    unmount();

    get.mockResolvedValue({ data: CATS });
    render(<Sonda type='expense' />);
    await waitFor(() => expect(screen.getByTestId('n')).toHaveTextContent('2'));
  });
});
