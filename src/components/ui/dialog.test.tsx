import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog, DialogContent, DialogTitle } from './dialog';

/**
 * Regresión de un bug de mobile: al tocar un Select y volver a tocar el MISMO
 * Select se cerraba el modal entero.
 *
 * Causa: Radix pone `pointer-events: none` en el <body> mientras su lista está
 * abierta. El toque sobre el propio trigger ya no llega al trigger; el
 * hit-test cae hasta el <html>, fuera del panel, y Headless UI lo lee como
 * "clic afuera". DialogContent ignora los cierres con esa firma exacta.
 *
 * El cierre por clic afuera no se puede ejercitar en jsdom (Headless UI no
 * reacciona a eventos sintéticos sobre el <html>), así que ese lado está
 * verificado en navegador real. Lo que estos tests fijan es el riesgo que
 * queda del lado del código: que el guardia NO se coma los cierres buenos.
 * En particular el reset por teclado -- sin él, la bandera quedaba puesta tras
 * tocar un select y el siguiente Escape no cerraba nada.
 */

function tocarCayendoAlHtml() {
  // Lo que ocurre mientras la lista de un Select está abierta
  document.body.style.pointerEvents = 'none';
  for (const tipo of ['pointerdown', 'mousedown']) {
    document.documentElement.dispatchEvent(
      new MouseEvent(tipo, { bubbles: true, cancelable: true }),
    );
  }
  document.body.style.pointerEvents = '';
}

function Modal({ onOpenChange }: { onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog defaultOpen onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Transferir entre cuentas</DialogTitle>
      </DialogContent>
    </Dialog>
  );
}

describe('DialogContent frente al body inerte de Radix', () => {
  beforeEach(() => {
    document.body.style.pointerEvents = '';
  });
  afterEach(() => {
    document.body.style.pointerEvents = '';
  });

  it('Escape cierra el modal', async () => {
    let abierto = true;
    render(<Modal onOpenChange={(o) => (abierto = o)} />);
    await screen.findByText('Transferir entre cuentas');

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(abierto).toBe(false));
  });

  it('Escape sigue cerrando después de un toque caído al <html>', async () => {
    let abierto = true;
    render(<Modal onOpenChange={(o) => (abierto = o)} />);
    await screen.findByText('Transferir entre cuentas');

    await act(async () => {
      tocarCayendoAlHtml();
    });
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(abierto).toBe(false));
  });

  it('el botón de cerrar sigue funcionando tras un toque caído al <html>', async () => {
    let abierto = true;
    render(<Modal onOpenChange={(o) => (abierto = o)} />);
    await screen.findByText('Transferir entre cuentas');

    await act(async () => {
      tocarCayendoAlHtml();
    });
    await userEvent.click(screen.getByRole('button', { name: /cerrar/i }));

    await waitFor(() => expect(abierto).toBe(false));
  });
});
