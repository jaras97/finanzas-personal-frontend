import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewTransactionModal from './NewTransactionModal';
import { _limpiarCacheCategorias } from '@/hooks/useCategories';

const get = vi.fn();
const post = vi.fn();
vi.mock('@/lib/api', () => ({
  default: {
    get: (...a: unknown[]) => get(...a),
    post: (...a: unknown[]) => post(...a),
  },
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
const toastWarning = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...a: unknown[]) => toastSuccess(...a),
    error: (...a: unknown[]) => toastError(...a),
    warning: (...a: unknown[]) => toastWarning(...a),
  },
}));

const CUENTA = { id: 5, name: 'Bancolombia', balance: 100000, currency: 'COP', status: 'active' };
const TARJETA = { id: 9, name: 'Visa', kind: 'credit_card', status: 'active' };
const CATEGORIA = {
  id: 3,
  name: 'Restaurantes',
  type: 'expense',
  is_active: true,
  is_system: false,
  parent_id: 1,
  parent_name: 'Comida fuera',
};
const GRUPO = {
  id: 1,
  name: 'Comida fuera',
  type: 'expense',
  is_active: true,
  is_system: false,
  parent_id: null,
};

/** Precargar el formulario evita pelearse con los selects de Radix: lo que se
 *  prueba acá es el guardado, no la selección. */
const INICIAL = {
  type: 'expense' as const,
  accountId: '5',
  categoryId: '3',
  amount: 50000,
  description: 'Almuerzo',
};

function jpg(nombre = 'recibo.jpg', bytes = 1024): File {
  const file = new File(['x'], nombre, { type: 'image/jpeg' });
  Object.defineProperty(file, 'size', { value: bytes });
  return file;
}

/**
 * Monta el modal cerrado y luego lo abre subiendo `openSignal`, que es como
 * ocurre en la app (el modal vive montado en la barra y se abre por señal).
 * Montarlo ya abierto no sirve: los efectos del mount correrían con el tipo
 * todavía vacío y limpiarían la cuenta y la categoría precargadas.
 */
function montar(props: Partial<React.ComponentProps<typeof NewTransactionModal>> = {}) {
  const inicial = props.initial ?? INICIAL;
  const onCreated = props.onCreated ?? (() => {});
  const utils = render(
    <NewTransactionModal
      onCreated={onCreated}
      initial={inicial}
      openSignal={0}
      hideTrigger
    />,
  );
  utils.rerender(
    <NewTransactionModal
      onCreated={onCreated}
      initial={inicial}
      openSignal={1}
      hideTrigger
    />,
  );
  return utils;
}

/** Espera a que el formulario esté listo para enviarse. */
async function botonCrear() {
  const boton = await screen.findByRole('button', { name: /crear transacción/i });
  await waitFor(() => expect(boton).not.toBeDisabled());
  return boton;
}

async function adjuntar(file: File) {
  const input = screen.getByTestId('tx-comprobante') as HTMLInputElement;
  await userEvent.upload(input, file);
}

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  toastSuccess.mockReset();
  toastError.mockReset();
  toastWarning.mockReset();
  localStorage.clear();
  // El hook cachea a nivel de módulo: sin esto un test heredaría la respuesta
  // del anterior y pasaría (o fallaría) por un motivo que no es el suyo.
  _limpiarCacheCategorias();

  get.mockImplementation((url: string) => {
    if (url === '/saving-accounts') return Promise.resolve({ data: [CUENTA] });
    if (url === '/debts') return Promise.resolve({ data: [TARJETA] });
    if (url === '/categories') return Promise.resolve({ data: [GRUPO, CATEGORIA] });
    if (url === '/currencies')
      return Promise.resolve({
        data: [{ code: 'COP', name: 'Peso', symbol: '$', decimal_digits: 0 }],
      });
    return Promise.resolve({ data: [] });
  });
  // La creación devuelve la transacción con su id; de ahí cuelga el adjunto.
  post.mockResolvedValue({ data: { id: 77 } });
});

describe('NewTransactionModal — comprobante al crear', () => {
  it('sube el comprobante al id que devolvió la creación', async () => {
    montar();
    await adjuntar(jpg());
    await userEvent.click(await botonCrear());

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        '/transactions/77/attachments',
        expect.any(FormData),
      ),
    );
    // Primero el movimiento, después el adjunto: al revés no hay id al que colgarlo.
    expect(post.mock.calls[0][0]).toBe('/transactions');
    expect(post.mock.calls[1][0]).toBe('/transactions/77/attachments');
  });

  it('no sube nada cuando el usuario no adjuntó comprobante', async () => {
    montar();
    await userEvent.click(await botonCrear());

    await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('cuelga el comprobante de la compra con tarjeta, no de una transacción suelta', async () => {
    montar({ initial: { ...INICIAL, accountId: 'debt-9' } });
    await adjuntar(jpg());
    const boton = await screen.findByRole('button', { name: /registrar compra/i });
    await waitFor(() => expect(boton).not.toBeDisabled());
    await userEvent.click(boton);

    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(post.mock.calls[0][0]).toBe('/debts/9/purchase');
    expect(post.mock.calls[1][0]).toBe('/transactions/77/attachments');
  });

  // El caso que de verdad importa: el movimiento ya existe y el adjunto falló.
  // Reportarlo como "no se pudo crear" haría que el usuario lo registre otra vez.
  it('si falla la subida, el movimiento no se reporta como fallido', async () => {
    post.mockImplementation((url: string) =>
      url.includes('/attachments')
        ? Promise.reject(new Error('storage caído'))
        : Promise.resolve({ data: { id: 77 } }),
    );
    const onCreated = vi.fn();
    montar({ onCreated });
    await adjuntar(jpg());
    await userEvent.click(await botonCrear());

    await waitFor(() => expect(toastWarning).toHaveBeenCalled());
    const aviso = String(toastWarning.mock.calls[0][0]);
    expect(aviso).toMatch(/registrado/i);
    expect(aviso).toMatch(/lista de movimientos/i);
    // Nada debe sugerir que la transacción no quedó guardada.
    expect(toastError).not.toHaveBeenCalled();
    // Y la lista tiene que refrescarse: el movimiento existe aunque el adjunto no.
    expect(onCreated).toHaveBeenCalled();
  });

  // El rechazo realista: una foto del móvil pesa más que el tope. El `accept`
  // del input ya filtra los formatos ajenos, pero no mira el tamaño.
  it('rechaza un archivo demasiado grande ANTES de crear el movimiento', async () => {
    montar();
    await adjuntar(jpg('foto.jpg', 8 * 1024 * 1024));

    expect(toastError).toHaveBeenCalledWith(expect.stringMatching(/5 MB/));
    // Lo que importa no es el aviso, sino que todavía no se creó nada: el
    // usuario aún puede cambiar el archivo antes de guardar. Al revés, se
    // enteraría con el movimiento ya registrado.
    expect(post).not.toHaveBeenCalled();
  });

  it('no deja pegado un archivo que fue rechazado', async () => {
    montar();
    await adjuntar(jpg('foto.jpg', 8 * 1024 * 1024));
    await userEvent.click(await botonCrear());

    // Se crea el movimiento, pero sin intentar subir el archivo descartado.
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][0]).toBe('/transactions');
  });

  it('no arrastra el comprobante al siguiente movimiento', async () => {
    const onCreated = vi.fn();
    const { rerender } = montar({ onCreated });
    await adjuntar(jpg());
    await userEvent.click(await botonCrear());
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));

    // Segundo registro encadenado, esta vez sin adjuntar nada.
    rerender(
      <NewTransactionModal
        onCreated={onCreated}
        initial={INICIAL}
        openSignal={2}
        hideTrigger
      />,
    );
    await userEvent.click(await botonCrear());

    // `onCreated` corre DESPUÉS de la subida, así que esperarlo garantiza que
    // un segundo adjunto ya habría ocurrido si el archivo hubiera quedado
    // pegado. Sin este anclaje el test pasa por carrera, no por corrección.
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(2));
    console.log('POSTS =', JSON.stringify(post.mock.calls.map((c) => c[0])));
    expect(
      post.mock.calls.filter((c) => String(c[0]).includes('/attachments')),
    ).toHaveLength(1);
  });
});
