/**
 * Tono visual compartido por porcentaje de presupuesto usado -- mismos
 * puntos de corte en la pestaña Presupuestos (`(app)/budgets`) y en la
 * sección "Presupuestos del mes" de Resumen, para que ambas vistas del
 * mismo dato se vean consistentes.
 */
export function progressTone(percentage: number) {
  if (percentage >= 100) {
    return {
      bar: 'bg-rose-500',
      badge:
        'border-rose-300 text-rose-700 bg-rose-50 dark:border-rose-800 dark:text-rose-200 dark:bg-rose-950/30',
    };
  }
  if (percentage >= 80) {
    return {
      bar: 'bg-amber-500',
      badge:
        'border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-800 dark:text-amber-200 dark:bg-amber-950/30',
    };
  }
  return {
    bar: 'bg-emerald-500',
    badge:
      'border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-200 dark:bg-emerald-950/30',
  };
}
