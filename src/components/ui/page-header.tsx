import { cn } from '@/lib/utils';

/**
 * Título + subtítulo + acciones que cada página bajo (app) repetía a mano
 * (`<h1 className='text-2xl font-semibold'>...`). Un solo lugar para que la
 * tipografía y el espaciado del encabezado de página no diverjan.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  /** 'end' (default): apila en mobile, alinea al final del bloque título+subtítulo
   *  en desktop -- para acciones "altas" (buscador, date range picker). 'center':
   *  fila única centrada verticalmente -- para uno o dos botones simples. */
  align = 'end',
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  align?: 'end' | 'center';
  className?: string;
}) {
  return (
    <div
      className={cn(
        align === 'end'
          ? 'flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between'
          : 'flex flex-wrap items-center justify-between gap-2',
        className,
      )}
    >
      <div className='min-w-0'>
        <h1 className='text-2xl font-semibold'>{title}</h1>
        {subtitle && (
          <p className='text-sm text-muted-foreground'>{subtitle}</p>
        )}
      </div>
      {actions}
    </div>
  );
}
