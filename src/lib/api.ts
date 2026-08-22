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
