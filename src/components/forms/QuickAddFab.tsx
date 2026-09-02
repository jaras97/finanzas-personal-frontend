'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import NewTransactionModal from './NewTransactionModal';
import { notificarCambioDeDatos } from '@/lib/dataRefresh';

/**
 * Registro rápido flotante: visible en cualquier pantalla de (app), no solo
 * en /transactions. Reusa el mismo formulario/lógica de NewTransactionModal
 * (oculto su trigger interno) en vez de duplicar la creación de transacciones.
 *
 * No hay caché de datos compartida entre features (cada hook hace su propio
 * fetch), así que tras crear desde acá avisamos por `notificarCambioDeDatos`:
 * los hooks de datos llevan el contador de versión en sus dependencias y
 * vuelven a pedir lo suyo. Antes esto era un window.location.reload(), que
 * funcionaba pero tiraba el scroll, los filtros de la pantalla y el estado de
 * cualquier otro formulario abierto.
 */
export default function QuickAddFab() {
  const [openSignal, setOpenSignal] = useState(0);

  return (
    <>
      <button
        onClick={() => setOpenSignal((s) => s + 1)}
        className={cn(
          'fixed right-4 bottom-4 md:right-6 md:bottom-6 z-40',
          'inline-flex h-14 w-14 items-center justify-center rounded-full',
          'bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 active:scale-95',
        )}
        aria-label='Registro rápido de transacción'
        title='Registro rápido de transacción'
      >
        <Plus className='h-6 w-6' />
      </button>

      <NewTransactionModal
        onCreated={notificarCambioDeDatos}
        hideTrigger
        openSignal={openSignal}
      />
    </>
  );
}
