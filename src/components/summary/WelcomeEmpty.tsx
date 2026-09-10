'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowRight, PieChart, Receipt, Wallet } from 'lucide-react';

/**
 * Lo primero que ve alguien que acaba de registrarse.
 *
 * Antes esta pantalla quedaba **en blanco**: sin cuentas no hay monedas, sin
 * monedas no hay resumen, y el dashboard renderizaba solo su encabezado y un
 * selector de fechas sobre nada. Quien llega por primera vez a su app de
 * finanzas se encuentra con un vacío que no explica qué hacer.
 *
 * **No es un onboarding obligatorio** y a propósito: la app tiene que
 * funcionar desde el minuto cero, y anteponer un asistente al primer gasto
 * añade fricción justo donde ya se cae la gente (11 de 18 usuarios nunca
 * registraron una transacción). Es un mapa de tres pasos con enlaces reales,
 * que desaparece solo en cuanto hay un movimiento.
 *
 * El tercer paso no lleva a ninguna parte a propósito: es el resultado, no una
 * tarea. Ponerle un enlace sería mandar al usuario a la pantalla vacía en la
 * que ya está.
 */

const PASOS = [
  {
    icono: Wallet,
    titulo: 'Crea una cuenta',
    texto: 'Tu cuenta de banco, el efectivo que cargas o una inversión. Es de dónde sale y a dónde entra la plata.',
    href: '/saving-accounts',
    cta: 'Ir a Cuentas',
  },
  {
    icono: Receipt,
    titulo: 'Registra tus movimientos',
    texto: 'Uno a uno con el botón verde de abajo a la derecha, o de una vez importando el extracto de tu banco.',
    href: '/transactions',
    cta: 'Ir a Transacciones',
  },
  {
    icono: PieChart,
    titulo: 'Mira en qué se te va',
    texto: 'Esta pantalla se llena sola: en qué categorías gastas, cuánto más que el mes pasado y qué queda al final.',
    href: null,
    cta: null,
  },
] as const;

export default function WelcomeEmpty() {
  return (
    <Card variant='surface'>
      <CardContent className='p-6 sm:p-8'>
        <div className='mx-auto max-w-2xl text-center'>
          <h2 className='text-lg font-semibold'>Empecemos por lo básico</h2>
          <p className='mx-auto mt-1 max-w-md text-sm text-muted-foreground'>
            Con dos pasos ya tienes un resumen real de tus finanzas. Puedes
            hacerlo ahora o cuando quieras — nada de esto es obligatorio.
          </p>
        </div>

        <ol className='mx-auto mt-6 grid max-w-4xl gap-4 sm:grid-cols-3'>
          {PASOS.map((paso, i) => {
            const Icono = paso.icono;
            return (
              <li
                key={paso.titulo}
                className={cn(
                  'flex flex-col rounded-xl border border-[hsl(var(--border))]',
                  'bg-white/70 p-4',
                )}
              >
                <div className='flex items-center gap-2'>
                  <span className='inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--primary))]'>
                    <Icono className='h-4 w-4' />
                  </span>
                  <span className='text-[11px] font-semibold uppercase tracking-wide text-muted-foreground tabular-nums'>
                    Paso {i + 1}
                  </span>
                </div>

                <p className='mt-3 font-medium'>{paso.titulo}</p>
                <p className='mt-1 flex-1 text-sm text-muted-foreground'>
                  {paso.texto}
                </p>

                {paso.href && (
                  <Link
                    href={paso.href}
                    className={cn(
                      'mt-3 inline-flex items-center gap-1 text-sm font-medium',
                      'text-[hsl(var(--primary))] hover:underline',
                    )}
                  >
                    {paso.cta}
                    <ArrowRight className='h-3.5 w-3.5' />
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
