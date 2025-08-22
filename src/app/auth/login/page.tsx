// app/login/page.tsx
'use client';

import AuthPanel from '@/components/auth/AuthPanel';

export default function LoginPage() {
  return (
    <main className='relative min-h-[100dvh] flex items-center justify-center p-4'>
      {/* Fondo global que ya tienes */}
      <div className='app-bg' />
      <AuthPanel />
    </main>
  );
}
