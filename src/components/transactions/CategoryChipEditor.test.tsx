import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryChipEditor from './CategoryChipEditor';
import type { Category, TransactionWithCategoryRead } from '@/types';

/**
 * El chip solo debe ser editable donde el backend acepta la edición.
 *
 * Es la mitad que se olvida: la validación del servidor ya rechaza una
 * transferencia, así que ofrecer el selector ahí no corrompe nada -- pero
 * convierte un control en una trampa, y el usuario descubre que no se puede
 * después de elegir.
 */

const patch = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { patch: (...a: unknown[]) => patch(...a) },
}));
const success = vi.fn();
const error = vi.fn();
vi.mock('sonner', () => ({ toast: { success: (m: string) => success(m), error: (m: string) => error(m) } }));

const CATEGORIAS: Category[] = [
  { id: 1, name: 'Transporte', type: 'expense', is_active: true, is_system: false, parent_id: null },
  { id: 2, name: 'Gasolina', type: 'expense', is_active: true, is_system: false, parent_id: 1 },
  { id: 3, name: 'Taxis', type: 'expense', is_active: true, is_system: false, parent_id: 1 },
];

const BASE: TransactionWithCategoryRead = {
  id: 77,
  amount: 50000,
  description: 'Uber al aeropuerto',
  type: 'expense',
  date: '2026-09-01T10:00:00',
  is_cancelled: false,
  reversed_transaction_id: null,
  source_type: null,
  saving_account_id: 1,
  category: null,
};

beforeEach(() => {
  patch.mockReset();
  patch.mockResolvedValue({ data: {} });
  success.mockReset();
  error.mockReset();
});

describe('CategoryChipEditor', () => {
  it('un movimiento normal se puede reclasificar desde el chip', async () => {
    const onChanged = vi.fn();
    render(
      <CategoryChipEditor tx={BASE} categories={CATEGORIAS} onChanged={onChanged} />,
    );

    await userEvent.click(screen.getByRole('button', { name: /pulsa para cambiarla/i }));
    await userEvent.click(await screen.findByRole('button', { name: 'Taxis' }));

    expect(patch).toHaveBeenCalledWith('/transactions/77', { category_id: 3 });
    expect(onChanged).toHaveBeenCalled();
  });

  it.each([
    ['una transferencia', { source_type: 'transfer' }],
    ['una cancelada', { is_cancelled: true }],
    ['una reversa', { reversed_transaction_id: 5 }],
  ])('%s no ofrece el selector', async (_caso, extra) => {
    render(
      <CategoryChipEditor
        tx={{ ...BASE, ...extra } as TransactionWithCategoryRead}
        categories={CATEGORIAS}
      />,
    );
    expect(screen.queryByRole('button', { name: /pulsa para cambiarla/i })).toBeNull();
    // Pero la categoría sigue siendo legible: no se oculta, solo no se edita.
    expect(screen.getByText('Sin categorizar')).toBeInTheDocument();
  });

  it('nunca ofrece un grupo, solo hojas', async () => {
    render(<CategoryChipEditor tx={BASE} categories={CATEGORIAS} />);
    await userEvent.click(screen.getByRole('button', { name: /pulsa para cambiarla/i }));

    await screen.findByRole('button', { name: 'Taxis' });
    // "Transporte" aparece como cabecera de sección, nunca como opción
    // pulsable: los grupos no reciben movimientos (invariante I1).
    const opciones = screen.getAllByRole('button').map((b) => b.textContent);
    expect(opciones).not.toContain('Transporte');
  });

  it('no llama al servidor si se elige la categoría que ya tenía', async () => {
    render(
      <CategoryChipEditor
        tx={{ ...BASE, category: CATEGORIAS[1] }}
        categories={CATEGORIAS}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /pulsa para cambiarla/i }));
    // El chip también dice "Gasolina": se busca por ROL para no confundir el
    // disparador (cuyo nombre accesible es el aria-label) con la opción.
    await userEvent.click(await screen.findByRole('button', { name: 'Gasolina' }));
    expect(patch).not.toHaveBeenCalled();
  });
});
