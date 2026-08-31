import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import api from './api';

/**
 * Se prueba el interceptor sustituyendo el ADAPTER de axios: la lógica de
 * renovación vive por encima del adapter, así que un adapter falso permite
 * controlar respuestas y contar llamadas sin tocar la red ni instalar
 * dependencias extra de mocking.
 */
type Handler = (config: AxiosRequestConfig) => Promise<AxiosResponse>;

const ok = (config: AxiosRequestConfig, data: unknown = {}): Promise<AxiosResponse> =>
  Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config } as AxiosResponse);

const unauthorized = (config: AxiosRequestConfig): Promise<never> => {
  const err = new Error('Unauthorized') as AxiosError;
  err.config = config as never;
  err.isAxiosError = true;
  err.response = { status: 401, data: {}, statusText: '', headers: {}, config } as never;
  return Promise.reject(err);
};

const serverError = (config: AxiosRequestConfig): Promise<never> => {
  const err = new Error('Boom') as AxiosError;
  err.config = config as never;
  err.isAxiosError = true;
  err.response = { status: 500, data: {}, statusText: '', headers: {}, config } as never;
  return Promise.reject(err);
};

let handler: Handler;
let calls: string[];

beforeEach(() => {
  calls = [];
  api.defaults.adapter = ((config: AxiosRequestConfig) => {
    calls.push(`${(config.method ?? 'get').toUpperCase()} ${config.url}`);
    return handler(config);
  }) as never;
});

const refreshCount = () => calls.filter((c) => c.includes('/auth/refresh')).length;

describe('interceptor de renovación de sesión', () => {
  it('ante un 401 renueva y reintenta la petición original', async () => {
    let firstAttempt = true;
    handler = (config) => {
      if (config.url === '/auth/refresh') return ok(config, { access_token: 'nuevo' });
      if (firstAttempt) {
        firstAttempt = false;
        return unauthorized(config);
      }
      return ok(config, { ok: true });
    };

    const res = await api.get('/transactions');
    expect(res.data).toEqual({ ok: true });
    expect(refreshCount()).toBe(1);
    // original (401) + refresh + reintento
    expect(calls).toHaveLength(3);
  });

  it('si el refresh también falla, propaga el 401 y no entra en bucle', async () => {
    handler = (config) => unauthorized(config);

    await expect(api.get('/transactions')).rejects.toMatchObject({
      response: { status: 401 },
    });
    // Un solo intento de refresh: `_retried` corta la recursión.
    expect(refreshCount()).toBe(1);
  });

  it('no intenta renovar ante un 401 de /auth/* (son credenciales malas, no sesión vencida)', async () => {
    handler = (config) => unauthorized(config);

    await expect(api.post('/auth/login')).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(refreshCount()).toBe(0);
  });

  it('deja pasar los errores que no son 401 sin tocarlos', async () => {
    handler = (config) => serverError(config);

    await expect(api.get('/summary')).rejects.toMatchObject({
      response: { status: 500 },
    });
    expect(refreshCount()).toBe(0);
  });

  /**
   * El caso que motivó la deduplicación: el backend ROTA el refresh token en
   * cada uso. Si varias peticiones en paralelo dispararan su propio refresh,
   * el primero invalidaría a los demás y tumbaría la sesión que se pretendía
   * salvar. Debe haber exactamente UN refresh.
   */
  it('varias peticiones que fallan a la vez comparten un único refresh', async () => {
    const yaReintentada = new Set<string>();
    handler = (config) => {
      if (config.url === '/auth/refresh')
        return new Promise((resolve) =>
          setTimeout(() => resolve(ok(config, { access_token: 'nuevo' }) as never), 20),
        ) as never;
      const key = config.url!;
      if (!yaReintentada.has(key)) {
        yaReintentada.add(key);
        return unauthorized(config);
      }
      return ok(config, { url: key });
    };

    const res = await Promise.all([
      api.get('/summary'),
      api.get('/transactions'),
      api.get('/saving-accounts'),
      api.get('/budgets'),
    ]);

    expect(res.map((r) => r.data.url)).toEqual([
      '/summary',
      '/transactions',
      '/saving-accounts',
      '/budgets',
    ]);
    expect(refreshCount()).toBe(1);
  });

  it('un 401 posterior vuelve a poder renovar (el promise compartido se libera)', async () => {
    let failNext = true;
    handler = (config) => {
      if (config.url === '/auth/refresh') return ok(config, {});
      if (failNext) {
        failNext = false;
        return unauthorized(config);
      }
      return ok(config, {});
    };
    await api.get('/a');
    expect(refreshCount()).toBe(1);

    failNext = true;
    await api.get('/b');
    // Si `refreshPromise` no se liberara, este segundo ciclo no renovaría.
    expect(refreshCount()).toBe(2);
  });
});
