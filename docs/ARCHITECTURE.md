# Arquitectura

## Routing y protección de rutas

**Grupos de rutas** (App Router):
- `src/app/(app)/` — shell autenticado: `summary`, `transactions`, `saving-accounts`, `debts`, `categories`, `admin`. Tiene su propio `layout.tsx` que renderiza `Sidebar` + `Footer` y hace **gating de suscripción del lado del cliente**.
- `src/app/auth/` — `login`, `expired`, `inactive`, `no-subscription`. Fuera de `(app)`, sin sidebar/footer.

No existe `src/app/page.tsx`: la ruta `/` la resuelve `src/middleware.ts`, que siempre redirige.

**`src/middleware.ts`** (Edge runtime):
- Lee la cookie `access_token` y la verifica con `jose.jwtVerify` usando `process.env.JWT_SECRET` (debe ser igual al `SECRET_KEY` del backend).
- Rutas privadas (por prefijo): `/summary`, `/transactions`, `/saving-accounts`, `/categories`, `/debts`, `/admin` → sin token o token inválido, redirige a `/auth/login`. El middleware solo verifica que haya **sesión válida**; que además sea admin lo valida el backend (403) y la propia página `/admin` al montar.
- En `/`: token válido → `/summary`; si no, → `/auth/login`.
- En `/auth/login`: token válido → redirige a `/summary` (evita mostrar login ya autenticado).
- ⚠️ `/auth/expired`, `/auth/inactive`, `/auth/no-subscription` están en el `matcher` pero **no tienen lógica de protección dentro del middleware** — al vivir fuera de `(app)`, quedan libremente accesibles sin ningún control (la protección real de esas pantallas depende solo del gating de suscripción del layout `(app)`, que no aplica a rutas fuera de ese grupo).
- Contiene bastante `console.log` de debug (con emojis) en cada rama — dejado en el código, no es solo de desarrollo.

**Gating de suscripción** (`src/app/(app)/layout.tsx`, client component):
- Llama a `useSubscriptionStatus()` **y** `useCurrentUser()` al montar. Mientras alguno no ha resuelto, muestra "Verificando suscripción..." sin sidebar.
- **Los administradores se saltan el gate por completo** (`isAdmin` → nunca se bloquea ni redirige). Son personal, no clientes: no tienen por qué tener suscripción propia, y sin esta excepción un admin sin suscripción quedaba bloqueado fuera del panel que justamente usa para otorgarlas. Coincide con el backend, donde `get_current_admin_user` nunca validó suscripción.
- Si `sessionStorage['fromLogin'] === '1'` (seteado por `LoginForm` justo tras login exitoso), redirige **silenciosamente** (sin toast) a la pantalla de suscripción correspondiente y limpia el flag.
- En cualquier otro caso (deep link, cambio de estado en caliente), muestra un `toast.error` y redirige — solo una vez por montaje (`didToast` ref).
- Si el estado no es válido, el layout renderiza `null` mientras el `useEffect` async decide el redirect — puede haber un flash de contenido en blanco.

## Autenticación

Reescrito por completo el 2026-08-22: la sesión ya no vive en el cliente. El backend fija una cookie httpOnly (`access_token`, dominio `.balancedcent.com` en producción) en `/auth/login` y la limpia en `/auth/logout`; el frontend nunca lee ni guarda el JWT.

**Cliente HTTP** (`src/lib/api.ts`):
- `baseURL = NEXT_PUBLIC_API_URL` (default `http://localhost:8000`; en producción apunta a `https://api.balancedcent.com`); fuerza `https://` si la URL no es `localhost`.
- `withCredentials: true` — es lo único que hace falta para que el navegador adjunte la cookie en cada request. No hay interceptor de request ni de response: no se lee ni escribe ningún token, no hay refresh automático ni redirect global en 401 (cada hook sigue manejando sus errores por su cuenta).
- Exporta `logout()`: hace `POST /auth/logout` (best-effort, ignora errores de red) para que el backend limpie la cookie — necesario porque JS no puede borrar una cookie httpOnly por sí mismo. Los 4 lugares que antes duplicaban la lógica de logout (`Header.tsx`, `Sidebar.tsx`, `auth/expired|inactive|no-subscription`) ahora solo llaman a este helper + `router.push('/auth/login')`.

**Login** (`LoginForm.tsx`): `POST /auth/login` (form-urlencoded, estilo OAuth2). El frontend no toca la respuesta más allá de leer el status — la cookie la fija el backend vía `Set-Cookie`. Setea `sessionStorage['fromLogin']='1'` y navega a `/summary`.

**Registro** (`RegisterForm.tsx`): `POST /auth/register` `{email, password}`. **No hay auto-login** tras registrarse — el usuario vuelve al tab de login. El mensaje de éxito indica que la cuenta necesita una suscripción activa (aprovisionamiento manual/admin, no self-serve).

**Recuperar contraseña** (`ForgotPasswordForm.tsx`): `POST /auth/forgot-password`. El tab correspondiente en `AuthPanel.tsx` está **comentado en la UI** (no se puede llegar a este formulario desde la interfaz actual salvo que se reactive el botón).

**Estado de suscripción** (`useSubscriptionStatus.ts`): `GET /subscriptions/me`. Prioridad de estado: `end_date` vencida → `expired` (incluso si `is_active` es true) → `!is_active` → `inactive` → vence en ≤7 días → `expiring_soon` → si no, `active`. 401/404 → `none`. Otros errores no degradan el estado (evita falsos negativos por errores transitorios), pero si el primer request falla con algo distinto de 401/404, el estado puede quedar atascado indefinidamente en `loading`.

**Logout**: centralizado en `logout()` (`src/lib/api.ts`), llamado desde `Header.tsx`, `Sidebar.tsx` y cada pantalla `auth/expired|inactive|no-subscription`. Ya no hay lógica duplicada ni token que limpiar del lado del cliente.

> ⚠️ Nota de migración: cualquier usuario que ya tuviera una sesión iniciada antes de este cambio conserva la cookie **vieja** (`access_token`, no-httpOnly, con dominio scoped solo a `www.balancedcent.com` — la ponía el frontend antiguo vía `js-cookie`). Esa cookie sigue siendo válida para el middleware (que solo la lee, no le importa quién la puso), así que deja entrar al usuario a `(app)`, pero **nunca llega a `api.balancedcent.com`** (dominio distinto), así que toda llamada a la API sale sin credenciales → 401 → `useSubscriptionStatus` muestra "Suscripción pendiente" aunque la cuenta esté bien. Se resuelve solo con un logout+login (que limpia la cookie vieja y pone la nueva, correctamente scoped). Confirmado en producción el 2026-08-22.

## Estado y fetching de datos

- **Zustand**: solo `useSidebarStore` (sidebar móvil) — el antiguo `useAuthStore` (token en `localStorage`) se eliminó junto con el resto de la persistencia de sesión en el cliente (ver Autenticación arriba). No hay un store global de datos de dominio.
- **Sin caché de servidor compartida** (no React Query): cada feature tiene su propio hook `useState`+`useEffect`+axios con `loading`/`error`/`refresh()` manual. Única excepción: `useDebts.ts` usa **SWR** (revalida on focus/reconnect), inconsistente con el resto.
- **Formularios**: todos manuales (`useState` por campo + validación a mano + `toast.error`), pese a tener `react-hook-form`/`zod`/`form.tsx` instalados y sin usar.
- Los inputs de monto/tasa usan `react-number-format` (`NumericFormat`) para separadores de miles/decimales según locale.

## Fechas y monedas

Dos estrategias de parámetros de fecha coexisten (a tener en cuenta al tocar filtros):
- **Summary / cash-flow**: fechas simples `YYYY-MM-DD` como `start_date`/`end_date` (`src/lib/dateParams.ts`).
- **Transactions**: límites completos en UTC como `startDate`/`endDate` (camelCase), convertidos desde el día local del navegador (`toUtcDayBoundsFromISOStrings`), para que el filtrado respete el día calendario local, no UTC crudo.

El patrón "fecha a mediodía local en ISO" (`dateToIsoAtLocalNoon` / `toIsoAtLocalNoon`) para evitar corrimientos de día por timezone está **copiado en al menos 4 lugares** distintos (`utils/dates.ts`, `NewTransactionModal.tsx`, `EditTransactionModal.tsx`, `PayDebtModal.tsx`) en vez de centralizado.

## Monedas (reescrito 2026-08-22)

`currencyType` es `string` (antes un union cerrado `"COP" | "USD"`). El catálogo real viene de `GET /currencies` vía el hook `useCurrencies()` (`src/hooks/useCurrencies.ts`), que devuelve `{code, name, symbol, decimal_digits}[]` para las 42 monedas que el backend soporta. Está wireado en:
- Todos los selects de moneda al crear/editar cuentas y deudas (`NewSavingAccountModal`, `NewDebtModal`, `EditDebtModal`) — antes hardcodeados a solo COP/USD.
- Las heurísticas de escala decimal ("¿esta moneda usa centavos?") en `TransferBetweenAccountsModal`, `NewTransactionModal`, `PayDebtModal`, `AddChargeToDebtModal`, `RegisterYieldModal` — antes todas asumían `currency === 'COP' ? 0 : 2`, lo cual es incorrecto para cualquier otra moneda sin decimales (JPY, CLP, KRW, ...). Ahora leen `decimal_digits` del catálogo.
- `CurrencyToggle` (dashboard) y las cards de "top categoría" — ya no filtran a `['COP','USD']`, muestran cualquier moneda que el usuario realmente tenga en sus datos (derivado de las respuestas de `/summary`, `/summary-extra/*`, no de una lista fija).

`formatCurrency` (`src/lib/format.ts`) usa `Intl.NumberFormat` con `style: 'currency'` en vez de un mapa manual de símbolos — antes mostraba siempre 0 decimales y el mismo `$` plano para COP y USD (ocultaba los centavos en USD y era ambiguo entre monedas); ahora Intl resuelve símbolo y decimales correctos por código ISO.

## Features principales

- **Resumen** (`(app)/summary`): combina 5 hooks independientes en paralelo (`useSummary`, `useAssetsSummary`, `useLiabilitiesSummary`, `useNetWorthSummary`, `useCashFlowSummary`), cada uno con su propio fetch — sin caché compartida entre ellos. Muestra KPIs, totales, gráfico de área (`AreaIncomeExpense`) y dos donuts por categoría (`DonutByCategory`). `SummaryLineChart.tsx` y `SummaryPieChart.tsx` existen pero **no se usan** en ninguna página (código muerto/iteración anterior).
- **Transacciones** (`(app)/transactions`): tabla (`@tanstack/react-table` vía `data-table.tsx`) + vista mobile en cards. Reglas de edición/reversión repetidas en `columns.tsx` y `page.tsx`: editable solo si es manual (sin `source_type`, no cancelada, no reversión, no compra con tarjeta); reversible si no cancelada, no ya reversada, y no es `transfer`. Crear una transacción de tipo `expense` permite elegir entre cuenta bancaria o tarjeta de crédito (prefijo `debt-<id>` en el picker) — en ese caso se llama `POST /debts/{id}/purchase` en vez de `POST /transactions`.
- **Cuentas de ahorro** (`(app)/saving-accounts`): agrupa por `type` (cash/bank/investment) + sección de cerradas. Política de acciones basada en si la cuenta tiene transacciones (`has-transactions`, cacheado localmente por cuenta): eliminar/editar-todo requieren "prístina" (sin transacciones), cerrar requiere balance 0, reabrir requiere estar cerrada. `WithdrawFromAccountModal.tsx` existe pero **no está enlazado a ningún botón** en la UI actual (el botón "Depositar" también está comentado en `AccountsSection.tsx`).
- **Deudas** (`(app)/debts`): agrupa por `kind` (loan/credit_card) + cerradas. "Pristina" = `transactions_count === 0`. Pagar (`PayDebtModal`) solo permite cuentas activas de la **misma moneda** que la deuda. "Agregar cargo" (`AddChargeToDebtModal`) incrementa el saldo sin tocar ninguna cuenta.
- **Categorías** (`(app)/categories`): lista activas/inactivas; las de sistema (`is_system`) están bloqueadas para editar/desactivar desde la UI. Desactivar = soft-delete (`DELETE`), con confirmación vía `ConfirmCategoryStatusModal`.
- **Administración** (`(app)/admin`, solo admins, desde 2026-08-22): lista paginada de usuarios con buscador por correo (con debounce de 350ms), mostrando rol y estado de suscripción de cada uno. Acciones: gestionar suscripción (`ManageSubscriptionModal` → crear/renovar/eliminar, contra `/subscriptions/admin/*`) y promover/degradar admins (`PATCH /admin/users/{id}/role`). El enlace en el sidebar solo aparece si `useCurrentUser().isAdmin`; el acceso real lo hace cumplir el backend (403). El backend rechaza quitar el último admin, y la UI lo muestra como error normal.

## Utils compartidos (`src/lib/`)

| Archivo | Propósito |
|---|---|
| `format.ts` | `formatCurrency` |
| `formatDate.ts` | formatea ISO → timezone del navegador (Luxon) |
| `formatDayLabel.ts` | igual, pero evita conversión de timezone si el input es un "día lógico" `YYYY-MM-DD` sin hora (para no correr un día las etiquetas de gráficos) |
| `date.ts` | `toLocalDateString` |
| `dateParams.ts` | construcción de query params de fecha (el más cargado; ver sección de fechas arriba) |
| `extractErrorMessage.ts` | desempaqueta errores de Axios/Pydantic (string, array de validación v2, `detail.message`) — usado en algunos hooks, pero varios modales (`NewDebtModal`, `EditDebtModal`, `AddChargeToDebtModal`, `CategoryModal`) reimplementan su propia versión local en vez de importar esta |
| `utils.ts` | `cn()` (clsx + tailwind-merge) |

## Componentes de layout con posible código huérfano

- `Header.tsx` no se usa en `(app)/layout.tsx` (que renderiza `Sidebar` + un FAB propio) — sigue sin usarse, pero ya no duplica lógica de logout (ambos llaman a `logout()` de `src/lib/api.ts`).
- `MobileSidebarTrigger.tsx` parece duplicar el FAB ya codificado inline en `(app)/layout.tsx`.

Vale la pena confirmar con una búsqueda de imports antes de eliminar cualquiera de los dos, por si se usan en algún lugar no cubierto en este análisis.
