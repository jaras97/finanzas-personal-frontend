import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  console.log('📌 Middleware iniciado');
  console.log('➡️ Pathname:', pathname);
  console.log('🪙 Token presente:', !!token);

  const privatePaths = [
    '/summary',
    '/transactions',
    '/saving-accounts',
    '/categories',
    '/debts',
  ];

  const isPrivateRoute = privatePaths.some(path =>
    pathname.startsWith(path),
  );
  const isAuthRoute = pathname.startsWith('/auth/login');

  // ✅ NUEVO: Redirección en la raíz
  if (pathname === '/') {
    if (token) {
      try {
        await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
        console.log('✅ Token válido en raíz, redirigiendo a /summary');
        return NextResponse.redirect(new URL('/summary', request.url));
      } catch (error) {
        console.log('❌ Token inválido en raíz, redirigiendo a /auth/login',error);
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    } else {
      console.log('🚫 Sin token en raíz, redirigiendo a /auth/login');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // 🔄 Si está en login y ya tiene token válido, redirigir a summary
  if (isAuthRoute && token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
      console.log('✅ Token válido en login, redirigiendo a /summary');
      return NextResponse.redirect(new URL('/summary', request.url));
    } catch (error) {
      console.log('❌ Token inválido en login, permitiendo acceso al login', error);
    }
  }

  // 🔐 Protección de rutas privadas
  if (isPrivateRoute) {
    if (!token) {
      console.log('🚫 No hay token en ruta privada, redirigiendo a /auth/login');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
      console.log('✅ Token válido, permitiendo acceso a la ruta privada');
    } catch (error) {
      console.log('❌ Token inválido o expirado en ruta privada, redirigiendo a /auth/login', error);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  console.log('✅ Middleware completado, permitiendo acceso');
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
    '/auth/login',
  ],
};