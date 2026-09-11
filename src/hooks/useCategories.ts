'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useDataVersion } from '@/lib/dataRefresh';
import type { Category } from '@/types';

export type OpcionesCategorias = {
  type?: 'income' | 'expense' | 'both';
  status?: 'active' | 'inactive' | 'all';
  /**
   * `false` no pide nada y devuelve la lista vacía. Existe porque varios
   * modales viven montados y cerrados: sin esto, abrir `/transactions` pediría
   * las categorías de cada uno antes de que el usuario abra ninguno.
   */
  enabled?: boolean;
};

/**
 * Caché por juego de parámetros, viva mientras dure la página.
 *
 * No es una caché de datos "de verdad" ni pretende serlo (el proyecto no tiene
 * react-query a propósito): resuelve un problema concreto y medible, que es que
 * `/categories` se pedía hasta siete veces a la vez. En `/transactions` hay tres
 * instancias de `NewTransactionModal` montadas -- escritorio, móvil y el FAB del
 * layout -- más los filtros, y todas pedían lo mismo por separado.
 *
 * Se guarda la **promesa**, no el resultado: si tres componentes montan en el
 * mismo tick, comparten la petición en vuelo en vez de disparar tres.
 */
const enVuelo = new Map<string, Promise<Category[]>>();
let versionCacheada: number | null = null;

function claveDe(opciones: OpcionesCategorias): string {
  return `${opciones.type ?? ''}|${opciones.status ?? ''}`;
}

function pedirCategorias(
  opciones: OpcionesCategorias,
  version: number,
): Promise<Category[]> {
  // Cualquier escritura que afecte a los datos invalida todo lo cacheado: es el
  // mismo contador que ya usan los demás hooks, no un mecanismo nuevo.
  if (versionCacheada !== version) {
    enVuelo.clear();
    versionCacheada = version;
  }

  const clave = claveDe(opciones);
  const cacheada = enVuelo.get(clave);
  if (cacheada) return cacheada;

  const params: Record<string, string> = {};
  if (opciones.type) params.type = opciones.type;
  if (opciones.status) params.status = opciones.status;

  const promesa = api
    .get('/categories', Object.keys(params).length ? { params } : undefined)
    .then((res) => (Array.isArray(res.data) ? (res.data as Category[]) : []))
    .catch((err) => {
      // Un fallo no se cachea: el siguiente montaje debe poder reintentar.
      enVuelo.delete(clave);
      throw err;
    });

  enVuelo.set(clave, promesa);
  return promesa;
}

/** Solo para los tests: olvida lo cacheado entre casos. */
export function _limpiarCacheCategorias() {
  enVuelo.clear();
  versionCacheada = null;
}

/**
 * Categorías del usuario, con el mismo contrato que `GET /categories`.
 *
 * Devuelve lo que responde el servidor **sin filtrar**: cada pantalla decide si
 * excluye las de sistema (la mayoría lo hace, pero el wizard de importación
 * necesita conservar «Sin categorizar», y los filtros de la lista las quieren
 * todas). Poner esa política acá obligaría a un tercer modo y escondería en un
 * hook una decisión que conviene leer en el sitio donde importa.
 */
export function useCategories(opciones: OpcionesCategorias = {}) {
  const { type, status, enabled = true } = opciones;
  const estables = useMemo<OpcionesCategorias>(() => ({ type, status }), [type, status]);

  const [resultado, setResultado] = useState<{ clave: string; datos: Category[] } | null>(
    null,
  );
  const [error, setError] = useState<unknown>(null);
  const dataVersion = useDataVersion();
  const [recarga, setRecarga] = useState(0);

  const clave = claveDe(estables);

  /**
   * `loading` se deriva de si lo que hay en mano corresponde a los parámetros
   * pedidos, en vez de ser un `useState` que se enciende dentro del efecto.
   *
   * La diferencia importa: con un estado aparte existe un render intermedio con
   * la lista vacía y `loading` todavía en `false`, y quien lo consuma concluye
   * «no hay categorías» cuando la verdad es «aún no llegaron». Eso borraba la
   * categoría precargada del formulario de nueva transacción.
   */
  const loading = enabled && resultado?.clave !== clave;

  useEffect(() => {
    if (!enabled) return;
    let vigente = true;
    pedirCategorias(estables, dataVersion)
      .then((datos) => {
        if (!vigente) return;
        setResultado({ clave, datos });
        setError(null);
      })
      .catch((err) => {
        if (!vigente) return;
        setResultado({ clave, datos: [] });
        setError(err);
      });
    return () => {
      vigente = false;
    };
  }, [estables, clave, dataVersion, recarga, enabled]);

  const categories = useMemo(
    () => (enabled && resultado?.clave === clave ? resultado.datos : []),
    [enabled, resultado, clave],
  );

  const refresh = () => {
    enVuelo.delete(clave);
    setResultado(null);
    setRecarga((r) => r + 1);
  };

  return { categories, loading, error, refresh };
}
