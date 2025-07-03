import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Toaster } from 'sonner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex min-h-screen'>
      <Sidebar />
      <div className='flex flex-col flex-1'>
        <Header />
        <main className='flex-1 p-4 bg-background'>
          {children}
          <Toaster position='top-center' />
        </main>
      </div>
    </div>
  );
}
