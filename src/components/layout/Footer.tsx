import Link from 'next/link';
import { PieChart, CableIcon } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Finanzas Personales';
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? 'v1.0';

  const modules = [
    { href: '/summary', label: 'Resumen' },
    { href: '/transactions', label: 'Transacciones' },
    { href: '/saving-accounts', label: 'Cuentas' },
    { href: '/debts', label: 'Deudas' },
    { href: '/categories', label: 'Categorías' },
  ];

  return (
    <footer
      className='
        bg-footer text-footer-foreground
        border-t border-footer-border
        pb-[env(safe-area-inset-bottom)]
      '
      aria-labelledby='footer-heading'
    >
      <h2 id='footer-heading' className='sr-only'>
        Pie de página
      </h2>

      <div className='max-w-7xl mx-auto px-4 md:px-6'>
        <div className='py-8 grid gap-8 md:grid-cols-3'>
          {/* Marca + CTA */}
          <div className='md:col-span-1'>
            <div className='flex items-center gap-2'>
              <span className='inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15'>
                <PieChart className='h-5 w-5 text-footer-foreground' />
              </span>
              <span className='font-medium text-footer-foreground text-base'>
                {appName}
              </span>
            </div>

            <p className='mt-3 leading-relaxed text-[hsl(var(--footer-foreground)/0.80)]'>
              Controla tu mes: resumen, movimientos, cuentas y deudas en un solo
              lugar.
            </p>

            <div className='mt-5'>
              <Link
                href='/saving-accounts'
                className='
                  inline-flex items-center gap-2 rounded-xl px-3 py-2
                  bg-white/10 hover:bg-white/15 text-footer-foreground
                  ring-1 ring-white/15
                  transition active:scale-[0.99]
                  focus-visible:outline-none focus-visible:ring-2 ring-footer-ring
                '
              >
                <CableIcon className='h-4 w-4' />
                Conectar cuentas
              </Link>
            </div>

            <p className='mt-3 text-xs text-[hsl(var(--footer-foreground)/0.70)]'>
              {version}
            </p>
          </div>

          {/* Módulos */}
          <nav className='grid gap-1' aria-label='Módulos'>
            <p className='font-medium text-footer-foreground mb-1'>Módulos</p>
            {modules.map((m) => (
              <FooterLink key={m.href} href={m.href}>
                {m.label}
              </FooterLink>
            ))}
          </nav>

          {/* Acciones rápidas */}
          <nav className='grid gap-1' aria-label='Acciones rápidas'>
            <p className='font-medium text-footer-foreground mb-1'>
              Acciones rápidas
            </p>
            <FooterLink href='/transactions'>Agregar transacción</FooterLink>
            <FooterLink href='/categories'>Gestionar categorías</FooterLink>
            <FooterLink href='/summary'>Ver resumen mensual</FooterLink>
            <FooterLink href='/debts'>Revisar deudas</FooterLink>
          </nav>
        </div>
      </div>

      {/* Subfooter */}
      <div className='border-t border-footer-border bg-white/5'>
        <div className='max-w-7xl mx-auto px-4 md:px-6 py-4'>
          <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
            <p className='text-xs text-[hsl(var(--footer-foreground)/0.75)]'>
              © {year} <span className='text-footer-foreground'>{appName}</span>
              . Todos los derechos reservados.
            </p>
            <p className='text-xs text-[hsl(var(--footer-foreground)/0.65)]'>
              Información general, no constituye asesoría financiera.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className='
        inline-flex items-center rounded-lg py-1 px-2
        text-[hsl(var(--footer-foreground)/0.85)]
        hover:text-footer-foreground hover:bg-white/5
        transition
        focus-visible:outline-2
        focus-visible:outline-[hsl(var(--footer-ring))]
        focus-visible:outline-offset-2
      '
    >
      {children}
    </Link>
  );
}
