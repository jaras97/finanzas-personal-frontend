import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImportPage from './page';

const get = vi.fn();
const post = vi.fn();
vi.mock('@/lib/api', () => ({
  default: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a) },
}));

const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: (...a: unknown[]) => toastError(...a) },
}));

// Radix marca `pointer-events: none` en el overlay, y userEvent se niega a
// interactuar con eso. En un navegador real sí funciona.
const setup = () => userEvent.setup({ pointerEventsCheck: 0 });

const CUENTA = { id: 7, name: 'Bancolombia', currency: 'COP', status: 'active' };

const CATEGORIAS = [
  { id: 100, name: 'Sin categorizar', type: 'both', is_active: true, is_system: true, system_key: 'uncategorized' },
  { id: 101, name: 'Mercado', type: 'expense', is_active: true, is_system: false },
];

const INSPECT = {
  mode: 'inspect',
  sample_rows: [
    ['Fecha', 'Descripcion', 'Monto'],
    ['10/08/2026', 'Compra Exito', '-85000'],
  ],
  column_count: 3,
  saved_profile: null,
};

const fila = (over: Record<string, unknown> = {}) => ({
  row_index: 0,
  date: '2026-08-10',
  description: 'Compra Exito',
  amount: 85000,
  type: 'expense',
  category_id: 100,
  category_name: 'Sin categorizar',
  is_duplicate: false,
  include: true,
  error: null,
  ...over,
});

const REVIEW = {
  mode: 'review',
  rows: [
    fila({ row_index: 0, description: 'Compra Exito' }),
    fila({ row_index: 1, description: 'Duplicada', is_duplicate: true, include: false }),
    fila({
      row_index: 2,
      description: 'Rota',
      date: null,
      amount: null,
      type: null,
      error: 'Fecha inválida',
      include: false,
    }),
    fila({ row_index: 3, description: 'Pago nomina', type: 'income', amount: 2000000 }),
  ],
  total_rows: 4,
  duplicate_count: 1,
  error_count: 1,
};

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  toastError.mockReset();
  get.mockImplementation((url: string) =>
    url === '/saving-accounts'
      ? Promise.resolve({ data: [CUENTA] })
      : Promise.resolve({ data: CATEGORIAS }),
  );
  // 1ª llamada: inspect (sin mapeo). 2ª: review (con mapeo).
  let preview = 0;
  post.mockImplementation((url: string) => {
    if (url === '/transactions/import/preview') {
      preview += 1;
      return Promise.resolve({ data: preview === 1 ? INSPECT : REVIEW });
    }
    if (url === '/transactions/import/confirm')
      return Promise.resolve({ data: { created: 2, skipped: 0 } });
    return Promise.resolve({ data: {} });
  });
});

const csv = () =>
  new File(['Fecha,Descripcion,Monto\n10/08/2026,Compra,-85000\n'], 'extracto.csv', {
    type: 'text/csv',
  });

/** Recorre el paso 1 (cuenta + archivo) y deja la pantalla en el paso 2. */
async function irAMapeo(user: ReturnType<typeof setup>) {
  render(<ImportPage />);
  await screen.findByText(/Importar movimientos/i);

  await user.click(screen.getByText(/Selecciona la cuenta/i));
  await user.click(await screen.findByText(/Bancolombia/));

  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  await user.upload(input, csv());
  await user.click(screen.getByRole('button', { name: /^continuar$/i }));
  await screen.findByText(/Primeras filas del archivo/i);
}

/** Continúa del paso 2 al 3 (revisión). */
async function irARevision(user: ReturnType<typeof setup>) {
  await irAMapeo(user);
  await user.click(screen.getByRole('button', { name: /^continuar$/i }));
  await screen.findByText(/seleccionadas/i);
}

describe('wizard de importación de CSV', () => {
  it('el primer preview va SIN mapeo (modo inspect) y muestra la muestra del archivo', async () => {
    const user = setup();
    await irAMapeo(user);

    const [, body] = post.mock.calls[0];
    expect((body as FormData).get('column_mapping')).toBeNull();
    expect((body as FormData).get('saving_account_id')).toBe('7');
    expect(screen.getByText('Compra Exito')).toBeInTheDocument();
  });

  it('el segundo preview ya manda el mapeo y el formato de fecha', async () => {
    const user = setup();
    await irARevision(user);

    const [, body] = post.mock.calls[1];
    expect(JSON.parse((body as FormData).get('column_mapping') as string)).toEqual({
      date: 0,
      description: 1,
      amount: 2,
    });
    expect((body as FormData).get('date_format')).toBe('%d/%m/%Y');
  });

  it('resume duplicados, errores y seleccionadas', async () => {
    const user = setup();
    await irARevision(user);
    expect(screen.getByText(/4 filas/)).toBeInTheDocument();
    expect(screen.getByText(/1 posibles duplicados/)).toBeInTheDocument();
    expect(screen.getByText(/1 con error/)).toBeInTheDocument();
    expect(screen.getByText(/2 seleccionadas/)).toBeInTheDocument();
  });

  it('marca las filas con su estado y deshabilita la casilla de las que tienen error', async () => {
    const user = setup();
    await irARevision(user);

    expect(screen.getByText('Posible duplicado')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();

    const filaRota = screen.getByText('Rota').closest('tr')!;
    expect(within(filaRota).getByRole('checkbox')).toBeDisabled();
  });

  /**
   * El test que más importa de todo el wizard: confirmar debe enviar
   * EXACTAMENTE las filas marcadas. Si esto se rompe, se importan
   * movimientos que el usuario descartó -- y nadie se entera hasta que
   * cuadra sus saldos.
   */
  it('confirmar envía solo las filas incluidas', async () => {
    const user = setup();
    await irARevision(user);

    await user.click(screen.getByRole('button', { name: /confirmar importación \(2\)/i }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        '/transactions/import/confirm',
        expect.objectContaining({ saving_account_id: 7 }),
      ),
    );
    const payload = post.mock.calls.find(
      (c) => c[0] === '/transactions/import/confirm',
    )![1] as { rows: { description: string }[] };

    expect(payload.rows).toHaveLength(2);
    expect(payload.rows.map((r) => r.description)).toEqual(['Compra Exito', 'Pago nomina']);
    // Ni la duplicada ni la rota deben viajar.
    expect(payload.rows.map((r) => r.description)).not.toContain('Duplicada');
    expect(payload.rows.map((r) => r.description)).not.toContain('Rota');
  });

  it('"marcar todas" no arrastra las filas con error', async () => {
    const user = setup();
    await irARevision(user);

    await user.click(screen.getByRole('button', { name: /^marcar todas$/i }));
    await user.click(screen.getByRole('button', { name: /confirmar importación/i }));

    const payload = post.mock.calls.find(
      (c) => c[0] === '/transactions/import/confirm',
    )![1] as { rows: { description: string }[] };
    // La duplicada sí entra (el usuario la forzó), la rota no puede.
    expect(payload.rows.map((r) => r.description)).toContain('Duplicada');
    expect(payload.rows.map((r) => r.description)).not.toContain('Rota');
  });

  it('"ignorar duplicados" desmarca solo los duplicados', async () => {
    const user = setup();
    await irARevision(user);

    await user.click(screen.getByRole('button', { name: /^marcar todas$/i }));
    await user.click(screen.getByRole('button', { name: /ignorar duplicados/i }));

    await user.click(screen.getByRole('button', { name: /confirmar importación/i }));
    const payload = post.mock.calls.find(
      (c) => c[0] === '/transactions/import/confirm',
    )![1] as { rows: { description: string }[] };
    expect(payload.rows.map((r) => r.description)).not.toContain('Duplicada');
    expect(payload.rows.map((r) => r.description)).toContain('Compra Exito');
  });

  it('no deja confirmar si no queda ninguna fila marcada', async () => {
    const user = setup();
    await irARevision(user);

    await user.click(screen.getByRole('button', { name: /desmarcar todas/i }));
    expect(screen.getByRole('button', { name: /confirmar importación \(0\)/i })).toBeDisabled();
  });

  it('muestra el resultado al terminar', async () => {
    const user = setup();
    await irARevision(user);
    await user.click(screen.getByRole('button', { name: /confirmar importación/i }));
    expect(await screen.findByText(/2 movimientos importados/i)).toBeInTheDocument();
  });

  it('guarda el perfil de mapeo cuando la casilla está marcada', async () => {
    const user = setup();
    await irARevision(user);
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        '/import-profiles',
        expect.objectContaining({ saving_account_id: 7, date_format: '%d/%m/%Y' }),
      ),
    );
  });

  it('avisa si el backend rechaza el archivo', async () => {
    post.mockImplementation(() =>
      Promise.reject({ isAxiosError: true, response: { data: { detail: 'El archivo está vacío.' } } }),
    );
    const user = setup();
    render(<ImportPage />);
    await screen.findByText(/Importar movimientos/i);
    await user.click(screen.getByText(/Selecciona la cuenta/i));
    await user.click(await screen.findByText(/Bancolombia/));
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, csv());
    await user.click(screen.getByRole('button', { name: /^continuar$/i }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });
});
