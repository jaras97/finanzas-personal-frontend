import { describe, it, expect } from 'vitest';
import {
  mergeTransferPairs,
  getStatusLabel,
  isTransferLeg,
  transferDisplayDescription,
  transferAmountDisplay,
} from './transactionDisplay';
import type { TransactionWithCategoryRead } from '@/types';

function tx(over: Partial<TransactionWithCategoryRead> = {}): TransactionWithCategoryRead {
  return {
    id: 1,
    amount: 1000,
    description: 'Movimiento',
    type: 'expense',
    date: '2026-08-30T12:00:00',
    is_cancelled: false,
    ...over,
  } as TransactionWithCategoryRead;
}

const account = (currency: string) => ({ id: 1, name: 'C', currency }) as never;

describe('getStatusLabel', () => {
  // Regresión: el chequeo de income/expense iba ANTES que el de transferencia,
  // y como `type` siempre es income/expense en una pata, "Transferencia" nunca
  // se alcanzaba. Afectaba la tabla y el historial por cuenta.
  it('etiqueta una pata de transferencia como "Transferencia", no como Egreso', () => {
    expect(getStatusLabel(tx({ type: 'expense', source_type: 'transfer' }))).toBe(
      'Transferencia',
    );
    expect(getStatusLabel(tx({ type: 'income', source_type: 'transfer' }))).toBe(
      'Transferencia',
    );
  });

  it('cancelada y reversa mandan sobre el resto', () => {
    expect(getStatusLabel(tx({ is_cancelled: true, source_type: 'transfer' }))).toBe(
      'Reversada',
    );
    expect(getStatusLabel(tx({ reversed_transaction_id: 9 }))).toBe('Reversa');
  });

  it('distingue compra con tarjeta de un egreso normal', () => {
    expect(getStatusLabel(tx({ source_type: 'credit_card_purchase' }))).toBe(
      'Compra con tarjeta',
    );
    expect(getStatusLabel(tx({ type: 'expense' }))).toBe('Egreso');
    expect(getStatusLabel(tx({ type: 'income' }))).toBe('Ingreso');
  });
});

describe('isTransferLeg', () => {
  it('solo es transferencia si source_type lo dice', () => {
    expect(isTransferLeg(tx({ source_type: 'transfer' }))).toBe(true);
    expect(isTransferLeg(tx({ source_type: 'debt_payment' }))).toBe(false);
    expect(isTransferLeg(tx())).toBe(false);
  });
});

describe('mergeTransferPairs', () => {
  const pair = (groupId = 'g1') => [
    tx({ id: 1, type: 'expense', source_type: 'transfer', transfer_group_id: groupId }),
    tx({ id: 2, type: 'income', source_type: 'transfer', transfer_group_id: groupId }),
  ];

  it('colapsa las 2 patas en una sola fila, quedándose con la de salida', () => {
    const out = mergeTransferPairs(pair());
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe(1);
    expect(out[0].type).toBe('expense');
    expect(out[0]._pairedWith?.id).toBe(2);
  });

  it('no toca los movimientos que no son transferencia', () => {
    const out = mergeTransferPairs([tx({ id: 7 }), tx({ id: 8, type: 'income' })]);
    expect(out.map((t) => t.id)).toEqual([7, 8]);
    expect(out[0]._pairedWith).toBeUndefined();
  });

  it('conserva el orden original de la lista', () => {
    const out = mergeTransferPairs([tx({ id: 5 }), ...pair(), tx({ id: 9 })]);
    expect(out.map((t) => t.id)).toEqual([5, 1, 9]);
  });

  // Degradación aceptada a propósito: si el par cruza el borde de la
  // paginación, cada pata se muestra sola en vez de fusionarse mal.
  it('deja la pata suelta si su pareja no está en la lista', () => {
    const [outgoing] = pair();
    const out = mergeTransferPairs([outgoing]);
    expect(out).toHaveLength(1);
    expect(out[0]._pairedWith).toBeUndefined();
  });

  it('no fusiona si el grupo trae más de 2 filas', () => {
    const extra = tx({ id: 3, source_type: 'transfer', transfer_group_id: 'g1' });
    expect(mergeTransferPairs([...pair(), extra])).toHaveLength(3);
  });

  it('mantiene separados dos grupos distintos', () => {
    const out = mergeTransferPairs([...pair('g1'), ...pair('g2')]);
    expect(out).toHaveLength(2);
  });
});

describe('transferDisplayDescription', () => {
  it('reemplaza las descripciones por defecto del backend', () => {
    expect(transferDisplayDescription(tx({ description: 'Transferencia de salida' }))).toBe(
      'Transferencia',
    );
    expect(transferDisplayDescription(tx({ description: 'Transferencia recibida' }))).toBe(
      'Transferencia',
    );
    expect(transferDisplayDescription(tx({ description: '' }))).toBe('Transferencia');
  });

  it('respeta la descripción que escribió el usuario', () => {
    expect(transferDisplayDescription(tx({ description: 'Pago arriendo' }))).toBe(
      'Pago arriendo',
    );
  });
});

describe('transferAmountDisplay', () => {
  it('muestra un solo monto si ambas patas son de la misma moneda', () => {
    const out = transferAmountDisplay(
      tx({ amount: 1000, saving_account: account('COP') }),
      tx({ amount: 1000, saving_account: account('COP') }),
    );
    expect(out).toContain('COP');
    expect(out).not.toContain('→');
  });

  // Fusionar montos de monedas distintas en un solo número sería un error
  // financiero: 50 USD y 200.000 COP no son "el mismo" monto.
  it('muestra ambos lados si la transferencia cruzó monedas', () => {
    const out = transferAmountDisplay(
      tx({ amount: 50, saving_account: account('USD') }),
      tx({ amount: 200000, saving_account: account('COP') }),
    );
    expect(out).toContain('USD');
    expect(out).toContain('COP');
    expect(out).toContain('→');
  });
});
