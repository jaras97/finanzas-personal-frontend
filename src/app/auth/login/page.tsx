import LoginForm from '@/components/forms/LoginForm';

export default function LoginPage() {
  return (
    <main className='min-h-screen flex items-center justify-center p-4'>
      <div className='max-w-md w-full space-y-6'>
        <h1 className='text-2xl font-semibold text-center'>Iniciar Sesión</h1>
        <LoginForm />
      </div>
    </main>
  );
}
