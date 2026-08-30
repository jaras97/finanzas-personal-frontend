// src/lib/api.ts
import axios from 'axios';

const RAW = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const baseURL =
  process.env.NODE_ENV === 'production' &&
  RAW.startsWith('http://') &&
  !RAW.includes('localhost')
    ? RAW.replace('http://', 'https://')
    : RAW;

// La sesión vive en una cookie httpOnly que el backend fija en /auth/login y
// limpia en /auth/logout. El navegador la adjunta solo por `withCredentials`
// -- el frontend nunca lee ni guarda el JWT (no hay nada que un XSS pueda
// robar de localStorage/document.cookie).
const api = axios.create({
  baseURL,
  withCredentials: true,
});

/**
 * Renovación automática de sesión.
 *
 * El access token dura horas; antes, al vencer, el usuario era expulsado a
 * media tarea sin aviso. Ahora un 401 dispara UN intento de `/auth/refresh`
 * y se reintenta la petición original.
 *
 * Tres detalles que evitan bugs sutiles:
 * - `_retried` marca la petición para no reintentar en bucle si el refresh
 *   también devuelve 401.
 * - Las llamadas a `/auth/*` se excluyen: un 401 de login es "credenciales
 *   malas", no "sesión vencida", y refrescar ahí no tiene sentido.
 * - `refreshPromise` comparte un único refresh entre todas las peticiones
 *   que fallen a la vez. Sin esto, una pantalla con 6 hooks en paralelo
 *   dispararía 6 refreshes; como el backend ROTA el token en cada uso, el
 *   primero invalidaría a los otros cinco y la sesión se caería sola.
 */
let refreshPromise: Promise<unknown> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error?.config;
    const status = error?.response?.status;
    const url: string = original?.url ?? '';

    if (status !== 401 || !original || original._retried || url.includes('/auth/')) {
      return Promise.reject(error);
    }

    original._retried = true;

    try {
      if (!refreshPromise) {
        refreshPromise = api.post('/auth/refresh').finally(() => {
          refreshPromise = null;
        });
      }
      await refreshPromise;
      return api(original);
    } catch {
      // El refresh falló: la sesión murió de verdad. Se propaga el 401
      // original para que la pantalla lo maneje como siempre.
      return Promise.reject(error);
    }
  },
);

// Limpia la cookie httpOnly de sesión en el backend. La cookie no se puede
// borrar desde el navegador (ese es el punto de httpOnly), así que cerrar
// sesión siempre pasa por este endpoint -- best-effort: si la llamada falla
// (red caída, backend abajo) igual queremos sacar al usuario del área
// protegida en el cliente.
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // ignorado a propósito: el caller siempre redirige a /auth/login después
  }
}

export default api;
