/**
 * Mapa de color único de la app: qué variante de Button/Card usar para cada
 * rol semántico. El color de un componente lo decide su ROL (positivo,
 * negativo, informativo...), nunca de qué tipo de entidad es dueño --
 * "Ver movimientos" se ve igual en una cuenta de efectivo, un banco o una
 * inversión; "Pagar" se ve igual en un préstamo o una tarjeta de crédito.
 *
 * Fuente: diagnóstico de diseño 2026-08-29 (ver docs/PLAN_DE_MEJORA.md).
 * Cambiar el color de un rol se hace una sola vez, acá.
 */

import type { buttonVariants } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;

export const buttonColorRole = {
  /** Ingresos, saldos sanos, reducir una deuda, confirmar algo bueno. */
  positive: 'soft-emerald',
  /** Egresos, eliminar, cancelar, cerrar sesión. */
  negative: 'soft-rose',
  /** Vencimientos próximos, "revisa esto antes de continuar". */
  warning: 'soft-amber',
  /** Ver detalle/histórico, transferencias, acciones de solo-consulta. */
  info: 'soft-sky',
  /** Específicamente la entidad "tarjeta de crédito", en cualquier pantalla. */
  creditCard: 'soft-fuchsia',
  /** Acciones secundarias sin carga semántica (editar, cancelar un modal). */
  neutral: 'soft-slate',
} as const satisfies Record<string, ButtonVariant>;

export type ButtonColorRole = keyof typeof buttonColorRole;
