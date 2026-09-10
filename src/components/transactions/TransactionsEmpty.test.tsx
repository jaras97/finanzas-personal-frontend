import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransactionsEmpty from './TransactionsEmpty';

/**
 * Son dos vacíos que se ven igual y piden acciones opuestas. Lo que se prueba
 * es que nunca se ofrezca la salida equivocada: «Limpiar filtros» a quien
 * acaba de registrarse es una salida a un problema que no tiene, y explicarle
 * qué es una transacción a quien tiene tres años de historial es ruido.
 */

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const props = {
  onClearFilters: vi.fn(),
  onShowAll: vi.fn(),
};

describe('TransactionsEmpty', () => {
  it('mientras no se sabe, no pinta nada', () => {
    const { container } = render(
      <TransactionsEmpty hasAnyTransaction={null} hasActiveFilters={false} {...props} />,
    );
    // Pintar el vacío equivocado durante medio segundo es peor que esperar.
    expect(container).toBeEmptyDOMElement();
  });

  it('a una cuenta nueva le explica qué hacer, no le ofrece limpiar filtros', () => {
    render(
      <TransactionsEmpty hasAnyTransaction={false} hasActiveFilters={false} {...props} />,
    );
    expect(screen.getByText(/todavía no hay movimientos/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /limpiar filtros/i })).toBeNull();
    expect(screen.getByRole('link', { name: /importar un extracto/i })).toBeInTheDocument();
  });

  it('con filtros activos ofrece limpiarlos', async () => {
    const onClearFilters = vi.fn();
    render(
      <TransactionsEmpty
        hasAnyTransaction
        hasActiveFilters
        onClearFilters={onClearFilters}
        onShowAll={vi.fn()}
      />,
    );
    expect(screen.queryByText(/todavía no hay movimientos/i)).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /limpiar filtros/i }));
    expect(onClearFilters).toHaveBeenCalled();
  });

  it('sin filtros que limpiar, la acción ensancha el rango', async () => {
    const onShowAll = vi.fn();
    render(
      <TransactionsEmpty
        hasAnyTransaction
        hasActiveFilters={false}
        onClearFilters={vi.fn()}
        onShowAll={onShowAll}
      />,
    );
    // Un botón «volver al rango por defecto» estando ya en él sería un botón
    // muerto: lo que falta ahí es ver más historial.
    expect(screen.queryByRole('button', { name: /limpiar filtros/i })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /ver todo el historial/i }));
    expect(onShowAll).toHaveBeenCalled();
  });
});
