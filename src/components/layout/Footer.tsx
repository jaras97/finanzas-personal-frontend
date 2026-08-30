export default function Footer() {
  const year = new Date().getFullYear();
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Balanced Cent';
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? 'v1.0';

  return (
    <footer
      className='bg-footer text-footer-foreground border-t border-footer-border pb-[env(safe-area-inset-bottom)]'
      aria-label='Pie de página'
    >
      <div className='max-w-7xl mx-auto px-4 md:px-6 py-3'>
        <p className='text-xs text-[hsl(var(--footer-foreground)/0.65)] text-center md:text-left'>
          © {year} {appName} · {version} · Información general, no constituye
          asesoría financiera.
        </p>
      </div>
    </footer>
  );
}
