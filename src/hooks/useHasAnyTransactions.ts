'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useDataVersion } from '@/lib/dataRefresh';

/**
 * ¿Este usuario ha registrado alguna vez un movimiento?
 *
 * Existe para poder distinguir dos vacíos que se ven igual y piden cosas
 * opuestas: «todavía no has registrado nada» (la acción es crear el primero)
 * y «tus filtros no devuelven nada» (la acción es limpiarlos). Ofrecer
 * «Limpiar filtros» a quien acaba de registrarse es ofrecerle una salida a un
 * problema que no tiene.
 *
 * Deliberadamente **sin rango de fechas**: la lista arranca filtrada al mes
 * en curso, así que un usuario con historial de agosto vería el vacío de
 * septiembre y se le trataría como recién llegado.
 *
 * `null` mientras no se sabe: pintar el estado vacío equivocado durante medio
 * segundo es peor que no pintar ninguno.
 */
export function useHasAnyTransactions() {
  const [tiene, setTiene] = useState<boolean | null>(null);
  const dataVersion = useDataVersion();

  useEffect(() => {
    let vigente = true;
    api
      .get('/transactions/with-category', {
        params: { page: 1, page_size: 1, include_reversals: true },
      })
      .then(({ data }) => {
        if (vigente) setTiene((data?.total ?? 0) > 0);
      })
      .catch(() => {
        // Ante la duda, se asume que sí tiene: el mensaje de «primer
        // movimiento» es el que peor envejece si se muestra por error.
        if (vigente) setTiene(true);
      });
    return () => {
      vigente = false;
    };
  }, [dataVersion]);

  return tiene;
}
