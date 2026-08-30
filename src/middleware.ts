import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;
  // La sesión sigue viva mientras exista refresh token, aunque el access
  // token ya haya vencido -- ver la protección de rutas privadas abajo.
  const refreshToken = request.cookies.get('refresh_token')?.value;

  const privatePaths = [
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
    // El middleware solo verifica que haya sesión válida; que además sea
    // admin lo valida el backend (403) y la propia página al montar.
    '/admin',
  ];

  const isPrivateRoute = privatePaths.some(path =>
    pathname.startsWith(path),
  );
  const isAuthRoute = pathname.startsWith('/auth/login');

  // Redirección en la raíz
  if (pathname === '/') {
    if (token) {
      try {
        await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
        return NextResponse.redirect(new URL('/summary', request.url));
      } catch {
        // Token vencido pero sesión renovable: igual va a la app.
        if (refreshToken) {
          return NextResponse.redirect(new URL('/summary', request.url));
        }
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }
    if (refreshToken) {
      return NextResponse.redirect(new URL('/summary', request.url));
    }
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Si está en login y ya tiene token válido, redirigir a summary
  if (isAuthRoute && token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
      return NextResponse.redirect(new URL('/summary', request.url));
    } catch {
      // Token inválido: se permite el acceso al login.
    }
  }

  // 🔐 Protección de rutas privadas
  if (isPrivateRoute) {
    if (!token) {
      // Sin access token pero CON refresh token: sesión renovable, no
      // expirada. Se deja pasar para que el interceptor de axios renueve en
      // la primera llamada a la API. Esto no abre un hueco: el middleware
      // solo decide si se pinta el cascarón de la app -- cada endpoint sigue
      // exigiendo un token válido del lado del backend.
      if (refreshToken) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    } catch {
      // Mismo criterio: access token vencido + refresh disponible = dejar
      // que el cliente renueve, en vez de expulsar a media tarea.
      if (refreshToken) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/summary/:path*',
    '/transactions/:path*',
    '/saving-accounts/:path*',
    '/categories/:path*',
    '/debts/:path*',
    '/recurring/:path*',
    '/budgets/:path*',
    '/import/:path*',
    '/rules/:path*',
    '/account/:path*',
    '/admin/:path*',
     '/auth/login',
    '/auth/expired',
    '/auth/inactive',
    '/auth/no-subscription',
  ],
};