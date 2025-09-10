'use client';

type Props = {
  className?: string;
  /**
   * 'shimmer' (default): franja deslizante
   * 'pulse': sólo animate-pulse
   * 'pulse-shimmer': ambos efectos
   * 'none': sin animación
   */
  variant?: 'shimmer' | 'pulse' | 'pulse-shimmer' | 'none';
  /**
   * Controla el contraste del fondo del bloque
   * 'muted' (default) | 'contrast' | 'surface'
   */
  tone?: 'muted' | 'contrast' | 'surface';
  /**
   * Velocidad de la franja
   */
  speed?: 'slow' | 'normal' | 'fast';
};

const speedMap = {
  slow: '2.0s',
  normal: '1.4s',
  fast: '1.0s',
};

export function Skeleton({
  className = '',
  variant = 'shimmer',
  tone = 'muted',
  speed = 'normal',
}: Props) {
  const usePulse = variant === 'pulse' || variant === 'pulse-shimmer';
  const useShimmer = variant === 'shimmer' || variant === 'pulse-shimmer';

  const baseVar =
    tone === 'contrast'
      ? 'var(--skeleton-base-contrast)'
      : tone === 'surface'
      ? 'var(--skeleton-base-surface)'
      : 'var(--skeleton-base)';

  return (
    <div
      aria-hidden='true'
      className={[
        'relative overflow-hidden rounded-md',
        usePulse ? 'animate-pulse' : '',
        className,
      ].join(' ')}
      style={{ background: baseVar }}
    >
      {useShimmer && (
        <div
          className={[
            'pointer-events-none absolute inset-0 -translate-x-full',
            // Gradiente más notorio + blend para aumentar contraste en light/dark
            'mix-blend-overlay',
            'motion-reduce:hidden',
          ].join(' ')}
          style={{
            backgroundImage:
              'linear-gradient(to right, transparent, var(--skeleton-via), transparent)',
            animation: `shimmer ${speedMap[speed]} ease-in-out infinite`,
          }}
        />
      )}
    </div>
  );
}
