import { describe, it, expect } from 'vitest';
import {
  ACCEPT_COMPROBANTE,
  MAX_COMPROBANTE_BYTES,
  motivoRechazoComprobante,
} from './attachments';

/** Crea un File del tamaño pedido sin reservar esa memoria de verdad. */
function archivo(nombre: string, tipo: string, bytes: number): File {
  const file = new File(['x'], nombre, { type: tipo });
  Object.defineProperty(file, 'size', { value: bytes });
  return file;
}

describe('motivoRechazoComprobante', () => {
  it('acepta los formatos que el backend admite', () => {
    for (const tipo of [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'application/pdf',
    ]) {
      expect(motivoRechazoComprobante(archivo('r', tipo, 1024))).toBeNull();
    }
  });

  it('rechaza un formato que el backend no admite, diciendo cuáles sí', () => {
    const motivo = motivoRechazoComprobante(
      archivo('recibo.gif', 'image/gif', 1024),
    );
    expect(motivo).toMatch(/no admitido/i);
    // El mensaje tiene que decir qué adjuntar en su lugar, no solo que falló.
    expect(motivo).toMatch(/PDF/);
  });

  it('rechaza un archivo vacío', () => {
    expect(motivoRechazoComprobante(archivo('r.jpg', 'image/jpeg', 0))).toMatch(
      /vacío/i,
    );
  });

  it('rechaza justo por encima del límite y acepta justo en el límite', () => {
    expect(
      motivoRechazoComprobante(
        archivo('r.jpg', 'image/jpeg', MAX_COMPROBANTE_BYTES),
      ),
    ).toBeNull();
    expect(
      motivoRechazoComprobante(
        archivo('r.jpg', 'image/jpeg', MAX_COMPROBANTE_BYTES + 1),
      ),
    ).toMatch(/5 MB/);
  });

  it('el accept del input ofrece exactamente los tipos que se validan', () => {
    // Si divergen, el selector de archivos deja elegir algo que después se
    // rechaza -- o esconde algo que sí era válido.
    expect(ACCEPT_COMPROBANTE.split(',')).toEqual([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'application/pdf',
    ]);
  });
});
