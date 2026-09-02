'use client';

import { useSyncExternalStore } from 'react';
import { mutate } from 'swr';

/**
 * Refresco de datos financieros sin recargar la página.
 *
 * Los hooks de datos son artesanales (cada uno hace su propio fetch en un
 * useEffect) y no comparten caché, así que al crear una transacción desde el
 * botón flotante no había forma de que la pantalla activa se enterara: se
 * recargaba la página entera, perdiendo scroll, filtros y estado del formulario.
 *
 * En vez de un bus de eventos por feature, publicamos un simple contador de
 * versión: cada hook lo mete en sus dependencias, así que incrementarlo hace
 * que TODOS vuelvan a pedir sus datos. Un hook se suma con dos líneas y no
 * cambia su lógica de fetch.
 */

let version = 0;
const oyentes = new Set<() => void>();

/** Llamar tras crear/editar/borrar algo que afecte saldos o movimientos. */
export function notificarCambioDeDatos() {
  version += 1;
  oyentes.forEach((o) => o());
  // useDebts usa SWR en vez del contador; revalidamos también sus claves.
  void mutate(() => true, undefined, { revalidate: true });
}

function suscribir(alCambiar: () => void) {
  oyentes.add(alCambiar);
  return () => {
    oyentes.delete(alCambiar);
  };
}

/**
 * Devuelve la versión actual. Solo se usa dentro de arrays de dependencias,
 * nunca se pinta, por eso el snapshot del servidor puede ser 0 sin riesgo de
 * desajuste de hidratación.
 */
export function useDataVersion() {
  return useSyncExternalStore(
    suscribir,
    () => version,
    () => 0,
  );
}
