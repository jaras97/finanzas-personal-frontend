// src/lib/api.ts
import axios, {
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';
import Cookies from 'js-cookie';

const RAW = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const baseURL =
  process.env.NODE_ENV === 'production' &&
  RAW.startsWith('http://') &&
  !RAW.includes('localhost')
    ? RAW.replace('http://', 'https://')
    : RAW;

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1) Obtener token (cookie primero; fallbacks por compatibilidad)
    let token: string | undefined;
    if (typeof window !== 'undefined') {
      token =
        Cookies.get('access_token') ||
        localStorage.getItem('access_token') ||
        localStorage.getItem('token') ||
        undefined;
    }

    if (token) {
      // 2) Asegurar que headers sea AxiosHeaders y setear Authorization
      //    (en Axios v1, headers puede venir como objeto "raw" o como AxiosHeaders)
      const h = config.headers;
      if (h instanceof AxiosHeaders) {
        if (!h.has('Authorization')) h.set('Authorization', `Bearer ${token}`);
      } else {
        // Convertir a AxiosHeaders preservando lo que hubiera
        const ax = new AxiosHeaders(h as any);
        ax.set('Authorization', `Bearer ${token}`);
        config.headers = ax; // ✅ sin reasignar `{}` ni romper tipos
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
