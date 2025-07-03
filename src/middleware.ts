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
    '/dashboard',
    '/transactions',
    '/saving-accounts',
    '/categories',
    '/debts',
  ];

  const isPrivateRoute = privatePaths.some(path =>
    pathname.startsWith(path),
  );
  const isAuthRoute = pathname.startsWith('/auth/login');

  console.log('🔒 Es ruta privada:', isPrivateRoute);
  console.log('🔑 Es ruta de login:', isAuthRoute);

  // Si está en login y ya tiene token válido, redirigir a dashboard
  if (isAuthRoute && token) {
    console.log('🔄 Usuario en /auth/login con token, verificando JWT...');
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
      console.log('✅ Token válido en login, redirigiendo a /dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
      console.log('❌ Token inválido en login, permitiendo acceso al login', error);
      // Token inválido, permitir acceso a login
    }
  }

  // Si está en ruta privada
  if (isPrivateRoute) {
    if (!token) {
      console.log('🚫 No hay token en ruta privada, redirigiendo a /auth/login');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    console.log('🔄 Verificando JWT en ruta privada...');
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
      console.log('✅ Token válido, permitiendo acceso a la ruta privada');
      // Token válido, permitir acceso
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
    '/dashboard/:path*',
    '/transactions/:path*',
    '/saving-accounts/:path*',
    '/categories/:path*',
    '/debts/:path*',
    '/auth/login',
  ],
};