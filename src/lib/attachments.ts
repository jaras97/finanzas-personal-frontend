import api from '@/lib/api';

/**
 * Las reglas de un comprobante viven acá y no en cada pantalla, porque ahora hay
 * dos que adjuntan: el formulario de creación y el modal de la lista. Duplicarlas
 * llevaría a que el mismo archivo se acepte en una y se rechace en la otra.
 *
 * Coinciden a propósito con `backend/app/api/attachments.py`. Validar en el
 * cliente no sustituye al backend --que sigue siendo quien decide-- pero en el
 * formulario de creación importa por otro motivo: sin esto, un archivo inválido
 * se descubre cuando el movimiento YA se registró, y entonces el aviso llega
 * tarde para poder corregir el archivo antes de guardar.
 */
export const TIPOS_COMPROBANTE = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
] as const;

/** Valor para el atributo `accept` de un `<input type='file'>`. */
export const ACCEPT_COMPROBANTE = TIPOS_COMPROBANTE.join(',');

export const MAX_COMPROBANTE_MB = 5;
export const MAX_COMPROBANTE_BYTES = MAX_COMPROBANTE_MB * 1024 * 1024;
export const MAX_COMPROBANTES_POR_MOVIMIENTO = 5;

/**
 * Devuelve el motivo del rechazo, o `null` si el archivo sirve.
 *
 * Los mensajes dicen qué hacer, no solo qué pasó: quien acaba de elegir un
 * archivo necesita saber cuál elegir en su lugar.
 */
export function motivoRechazoComprobante(file: File): string | null {
  if (!TIPOS_COMPROBANTE.includes(file.type as (typeof TIPOS_COMPROBANTE)[number])) {
    return 'Formato no admitido. Adjunta una imagen (JPG, PNG, WEBP, HEIC) o un PDF.';
  }
  if (file.size === 0) {
    return 'El archivo está vacío. Vuelve a elegirlo.';
  }
  if (file.size > MAX_COMPROBANTE_BYTES) {
    return `El archivo supera el límite de ${MAX_COMPROBANTE_MB} MB.`;
  }
  return null;
}

/** Sube un comprobante ya validado a un movimiento que existe. */
export async function subirComprobante(
  transactionId: number,
  file: File,
): Promise<void> {
  const form = new FormData();
  form.append('file', file);
  await api.post(`/transactions/${transactionId}/attachments`, form);
}
