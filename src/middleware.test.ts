import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

// `jose` se mockea para controlar si el access token se considera válido sin
// tener que firmar JWTs reales en el test.
const jwtVerify = vi.fn();
vi.mock('jose', () => ({ jwtVerify: (...a: unknown[]) => jwtVerify(...a) }));

import { middleware } from './middleware';

type Cookies = { access_token?: string; refresh_token?: string };

function request(pathname: string, cookies: Cookies = {}): NextRequest {
  return {
    nextUrl: { pathname },
    url: `https://www.balancedcent.com${pathname}`,
    cookies: {
      get: (name: keyof Cookies) =>
        cookies[name] ? { name, value: cookies[name] } : undefined,
    },
  } as unknown as NextRequest;
}

/** Devuelve el destino del redirect, o null si la petición se dejó pasar. */
async function redirectTarget(req: NextRequest): Promise<string | null> {
  const res = await middleware(req);
  const location = res.headers.get('location');
  return location ? new URL(location).pathname : null;
}

const validToken = () =>
  jwtVerify.mockImplementation(async () => ({ payload: { sub: 'u1' } }));
// Lanza síncronamente en vez de devolver una promesa rechazada: el try/catch
// del middleware lo captura igual, y así no queda ninguna promesa rechazada
// suelta que Vitest reporte como fallo del test.
const expiredToken = () =>
  jwtVerify.mockImplementation(() => {
    throw new Error('expired');
  });

// `mockReset()` deja el mock devolviendo undefined, lo que equivale a "token
// válido" y hacía fallar los casos de token vencido. Se fija un default
// explícito y a prueba de olvidos: sin sesión válida. Los tests que necesiten
// una sesión buena llaman `validToken()`.
beforeEach(() => {
  jwtVerify.mockClear();
  expiredToken();
});

describe('rutas privadas', () => {
  it('sin ninguna cookie manda a login', async () => {
    expect(await redirectTarget(request('/summary'))).toBe('/auth/login');
  });

  it('con access token válido deja pasar', async () => {
    validToken();
    expect(await redirectTarget(request('/summary', { access_token: 'ok' }))).toBeNull();
  });

  /**
   * El caso que habilita la renovación automática: el access token venció
   * pero la sesión sigue viva. Si el middleware redirigiera acá, expulsaría
   * al usuario antes de que el interceptor de axios alcance a renovar.
   */
  it('con access vencido pero refresh presente deja pasar (para que el cliente renueve)', async () => {
    expiredToken();
    const req = request('/summary', { access_token: 'viejo', refresh_token: 'r' });
    expect(await redirectTarget(req)).toBeNull();
  });

  it('sin access pero con refresh deja pasar', async () => {
    const req = request('/transactions', { refresh_token: 'r' });
    expect(await redirectTarget(req)).toBeNull();
  });

  // El punto anterior no puede convertirse en un hueco: sin refresh, un
  // token vencido sigue mandando a login.
  it('con access vencido y SIN refresh manda a login', async () => {
    expiredToken();
    const req = request('/summary', { access_token: 'viejo' });
    expect(await redirectTarget(req)).toBe('/auth/login');
  });

  it.each([
    '/summary',
    '/transactions',
    '/saving-accounts',
    '/categories',
    '/debts',
    '/recurring',
    '/budgets',
    '/import',
    '/rules',
    '/account',
    '/admin',
  ])('protege %s', async (path) => {
    expect(await redirectTarget(request(path))).toBe('/auth/login');
  });
});

describe('raíz', () => {
  it('sin sesión manda a login', async () => {
    expect(await redirectTarget(request('/'))).toBe('/auth/login');
  });

  it('con sesión válida manda a summary', async () => {
    validToken();
    expect(await redirectTarget(request('/', { access_token: 'ok' }))).toBe('/summary');
  });

  it('con access vencido pero refresh presente igual entra a la app', async () => {
    expiredToken();
    const req = request('/', { access_token: 'viejo', refresh_token: 'r' });
    expect(await redirectTarget(req)).toBe('/summary');
  });
});

describe('pantalla de login', () => {
  it('con sesión válida redirige a summary (no muestra login otra vez)', async () => {
    validToken();
    const req = request('/auth/login', { access_token: 'ok' });
    expect(await redirectTarget(req)).toBe('/summary');
  });

  it('con token inválido permite ver el login', async () => {
    expiredToken();
    const req = request('/auth/login', { access_token: 'malo' });
    expect(await redirectTarget(req)).toBeNull();
  });

  it('sin cookies permite ver el login', async () => {
    expect(await redirectTarget(request('/auth/login'))).toBeNull();
  });
});

describe('rutas públicas', () => {
  it('reset-password es accesible sin sesión (se llega desde el correo)', async () => {
    expect(await redirectTarget(request('/auth/reset-password'))).toBeNull();
  });
});
