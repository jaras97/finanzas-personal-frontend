# finanzas-personal-frontend

Frontend web de **Balanced Cent**, una app de finanzas personales. Next.js (App Router) + TypeScript. Consume la API de [finanzas-personales-backend](../backend).

> Documentación detallada en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): routing/middleware, flujo de autenticación, estado, y desglose de cada feature (resumen, transacciones, cuentas, deudas, categorías).

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (modo `strict` desactivado en `tsconfig.json`).
- **shadcn/ui** (estilo `new-york`) sobre **Radix UI** para primitivos simples, pero los **modales usan un `Dialog` propio construido sobre Headless UI** (`src/components/ui/dialog.tsx`), no Radix Dialog.
- **Zustand** para estado global mínimo (estado del sidebar móvil). La sesión ya no vive en el cliente — ver Autenticación abajo.
- **Axios** vía un cliente compartido (`src/lib/api.ts`); fetching de datos mayormente con hooks `useState`/`useEffect` hechos a mano (una sola excepción usa **SWR**: `useDebts`).
- **Recharts** para gráficos, **Tailwind CSS v4** para estilos, **Luxon** para manejo de fechas/timezones.
- **pnpm** como package manager.

## Puesta en marcha local

```bash
# 1. Instalar dependencias
pnpm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# JWT_SECRET debe ser idéntico al SECRET_KEY del backend

# 3. Levantar el servidor de desarrollo (con el backend corriendo en :8000)
pnpm dev
```

La app queda disponible en `http://localhost:3000`.

## Variables de entorno

Ver [`.env.example`](.env.example). Resumen:

| Variable | Requerida | Descripción |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | no (default `http://localhost:8000`) | Base URL de la API backend. En producción: `https://api.balancedcent.com` (debe compartir dominio padre con el frontend para que la cookie de sesión funcione) |
| `JWT_SECRET` | sí | Secreto para verificar el JWT en middleware de Edge — debe coincidir con `SECRET_KEY` del backend |
| `NEXT_PUBLIC_APP_NAME` | no | Nombre mostrado en el footer |
| `NEXT_PUBLIC_APP_VERSION` | no | Versión mostrada en el footer |
| `NODE_ENV` | automática | Controla CSP headers, upgrade http→https, flag `secure` de cookies |
| `DOCKER_BUILD` | no | Si es truthy, `next.config.ts` usa `output: "standalone"` (deploy en contenedor) |

## Scripts

- `pnpm dev` — servidor de desarrollo (`next dev --turbopack`)
- `pnpm build` — build de producción
- `pnpm start` — sirve el build de producción
- `pnpm lint` — ESLint

## Estructura del proyecto

```
src/
  app/
    (app)/              # rutas protegidas: summary, transactions, saving-accounts, debts, categories
    auth/                # login, expired, inactive, no-subscription
    layout.tsx           # layout raíz (fuentes, Toaster)
    middleware.ts         # protección de rutas por JWT (ver docs/ARCHITECTURE.md)
  components/
    auth/, forms/, chart/, kpi/, layout/, skeletons/, ui/
  hooks/                 # un hook de datos por feature (useSummary, useTransactions, useDebts, ...)
  lib/
    api.ts               # cliente axios compartido + logout()
    store/sidebarStore.ts  # store de Zustand (sidebar móvil)
    format.ts, formatDate.ts, formatDayLabel.ts, date.ts, dateParams.ts  # utils de fecha/moneda
  types/index.ts          # tipos TypeScript de todo el dominio
```

No hay página en `src/app/page.tsx` — la ruta `/` la resuelve enteramente `middleware.ts` redirigiendo a `/summary` o `/auth/login`.

## Notas importantes para desarrollo

- La sesión vive en una cookie httpOnly que fija el backend (`/auth/login`) — el frontend nunca lee ni guarda el JWT (ni `localStorage` ni `document.cookie`). Para cerrar sesión siempre hay que llamar a `logout()` de `src/lib/api.ts` (hace `POST /auth/logout`), nunca manipular cookies/storage a mano.
- Si un usuario que ya tenía sesión antes del 2026-08-22 ve "Suscripción pendiente" sin razón aparente, es la cookie vieja (no-httpOnly) quedando huérfana — un logout+login lo resuelve. Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para el detalle completo.
- Los formularios usan `useState` manual por campo; `react-hook-form` + `zod` están instalados y hay un primitivo `form.tsx` de shadcn, pero **no se usan en ningún formulario actual** — están disponibles pero no adoptados.
