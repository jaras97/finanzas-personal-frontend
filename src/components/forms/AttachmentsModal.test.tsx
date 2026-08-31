import type { ComponentProps } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AttachmentsModal from './AttachmentsModal';
import type { Attachment } from '@/types';

const get = vi.fn();
const post = vi.fn();
const del = vi.fn();
vi.mock('@/lib/api', () => ({
  default: {
    get: (...a: unknown[]) => get(...a),
    post: (...a: unknown[]) => post(...a),
    delete: (...a: unknown[]) => del(...a),
  },
}));

const toastError = vi.fn();
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: (...a: unknown[]) => toastError(...a) },
}));

const attachment = (over: Partial<Attachment> = {}): Attachment => ({
  id: 1,
  transaction_id: 10,
  filename: 'recibo.jpg',
  content_type: 'image/jpeg',
  size_bytes: 2048,
  created_at: '2026-08-31T10:00:00',
  url: 'https://firmada.example/x',
  ...over,
});

function open(props: Partial<ComponentProps<typeof AttachmentsModal>> = {}) {
  return render(
    <AttachmentsModal
      open
      onOpenChange={() => {}}
      transactionId={10}
      description="Traslado a ahorros"
      {...props}
    />,
  );
}

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  del.mockReset();
  toastError.mockReset();
  get.mockResolvedValue({ data: [] });
  post.mockResolvedValue({ data: attachment() });
  del.mockResolvedValue({ data: {} });
});

describe('AttachmentsModal', () => {
  it('pide los comprobantes de la transacción al abrirse', async () => {
    open();
    await waitFor(() => expect(get).toHaveBeenCalledWith('/transactions/10/attachments'));
  });

  it('muestra el estado vacío cuando no hay comprobantes', async () => {
    open();
    expect(await screen.findByText(/aún no tiene comprobantes/i)).toBeInTheDocument();
  });

  it('lista los comprobantes con su nombre y tamaño', async () => {
    get.mockResolvedValue({ data: [attachment({ filename: 'extracto.pdf', size_bytes: 2048 })] });
    open();
    expect(await screen.findByText('extracto.pdf')).toBeInTheDocument();
    expect(screen.getByText('2 KB')).toBeInTheDocument();
  });

  it('ofrece abrir el archivo solo si llegó una URL firmada', async () => {
    get.mockResolvedValue({ data: [attachment()] });
    const { unmount } = open();
    await waitFor(() =>
      expect(screen.getByRole('link')).toHaveAttribute('href', 'https://firmada.example/x'),
    );
    unmount();

    // Si el almacenamiento no respondió, la fila igual se lista pero sin
    // botón de abrir -- no debe romperse el listado entero.
    get.mockResolvedValue({ data: [attachment({ url: null })] });
    open();
    expect(await screen.findByText('recibo.jpg')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('sube el archivo como multipart y refresca la lista', async () => {
    const onChanged = vi.fn();
    open({ onChanged });
    await screen.findByText(/aún no tiene comprobantes/i);

    const file = new File(['bytes'], 'recibo.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/transactions/10/attachments');
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('file')).toBe(file);

    // Refresca la lista y avisa al padre para que actualice el contador.
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    expect(onChanged).toHaveBeenCalled();
  });

  it('elimina un comprobante y refresca', async () => {
    get.mockResolvedValue({ data: [attachment({ id: 42 })] });
    const onChanged = vi.fn();
    open({ onChanged });
    await screen.findByText('recibo.jpg');

    await userEvent.click(screen.getByRole('button', { name: /eliminar recibo\.jpg/i }));

    await waitFor(() => expect(del).toHaveBeenCalledWith('/attachments/42'));
    expect(onChanged).toHaveBeenCalled();
  });

  it('bloquea la subida al llegar al máximo de 5', async () => {
    get.mockResolvedValue({
      data: [1, 2, 3, 4, 5].map((id) => attachment({ id, filename: `r${id}.jpg` })),
    });
    open();
    const boton = await screen.findByRole('button', { name: /máximo alcanzado/i });
    expect(boton).toBeDisabled();
  });

  it('avisa con un toast si el backend rechaza la subida', async () => {
    post.mockRejectedValue({
      isAxiosError: true,
      response: { data: { detail: 'Formato no admitido.' } },
    });
    open();
    await screen.findByText(/aún no tiene comprobantes/i);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, new File(['x'], 'grande.jpg', { type: 'image/jpeg' }));

    await waitFor(() => expect(toastError).toHaveBeenCalled());
  });

  it('no pide nada si no hay transacción seleccionada', async () => {
    open({ transactionId: null });
    await waitFor(() => expect(get).not.toHaveBeenCalled());
  });
});
