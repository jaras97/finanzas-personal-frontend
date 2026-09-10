import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UncategorizedBanner from './UncategorizedBanner';

/**
 * Un aviso de trabajo pendiente tiene dos formas de salir mal: no aparecer
 * cuando hay algo que hacer, y no callarse cuando el usuario ya dijo que hoy
 * no. Las dos se prueban acá.
 */

const get = vi.fn();
vi.mock('@/lib/api', () => ({ default: { get: (...a: unknown[]) => get(...a) } }));
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

beforeEach(() => {
  get.mockReset();
  sessionStorage.clear();
});

describe('UncategorizedBanner', () => {
  it('no se pinta cuando no hay nada pendiente', async () => {
    get.mockResolvedValue({ data: { count: 0 } });
    const { container } = render(<UncategorizedBanner />);
    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('muestra el número y enlaza a la bandeja', async () => {
    get.mockResolvedValue({ data: { count: 51 } });
    render(<UncategorizedBanner />);
    expect(await screen.findByText('51')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /clasificar/i })).toHaveAttribute(
      'href',
      '/transactions/pendientes',
    );
  });

  it('en singular no dice "movimientos"', async () => {
    get.mockResolvedValue({ data: { count: 1 } });
    render(<UncategorizedBanner />);
    expect(
      await screen.findByText(/movimiento está sin clasificar/),
    ).toBeInTheDocument();
  });

  it('al descartarlo desaparece y no vuelve en esta sesión', async () => {
    get.mockResolvedValue({ data: { count: 4 } });
    const { unmount } = render(<UncategorizedBanner />);
    await screen.findByText('4');

    await userEvent.click(screen.getByRole('button', { name: /ocultar aviso/i }));
    expect(screen.queryByText('4')).toBeNull();

    // Otra pantalla monta el mismo aviso: sigue callado.
    unmount();
    const { container } = render(<UncategorizedBanner />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('un fallo del servidor no pinta nada ni rompe la página', async () => {
    get.mockRejectedValue(new Error('502'));
    const { container } = render(<UncategorizedBanner />);
    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
