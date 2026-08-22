# Arquitectura

## Routing y protección de rutas

**Grupos de rutas** (App Router):
- `src/app/(app)/` — shell autenticado: `summary`, `transactions`, `saving-accounts`, `debts`, `categories`. Tiene su propio `layout.tsx` que renderiza `Sidebar` + `Footer` y hace **gating de suscripción del lado del cliente**.
- `src/app/auth/` — `login`, `expired`, `inactive`, `no-subscription`. Fuera de `(app)`, sin sidebar/footer.

No existe `src/app/page.tsx`: la ruta `/` la resuelve `src/middleware.ts`, que siempre redirige.

**`src/middleware.ts`** (Edge runtime):
- Lee la cookie `access_token` y la verifica con `jose.jwtVerify` usando `process.env.JWT_SECRET` (debe ser igual al `SECRET_KEY` del backend).
- Rutas privadas (por prefijo): `/summary`, `/transactions`, `/saving-accounts`, `/categories`, `/debts` → sin token o token inválido, redirige a `/auth/login`.
- En `/`: token válido → `/summary`; si no, → `/auth/login`.
- En `/auth/login`: token válido → redirige a `/summary` (evita mostrar login ya autenticado).
- ⚠️ `/auth/expired`, `/auth/inactive`, `/auth/no-subscription` están en el `matcher` pero **no tienen lógica de protección dentro del middleware** — al vivir fuera de `(app)`, quedan libremente accesibles sin ningún control (la protección real de esas pantallas depende solo del gating de suscripción del layout `(app)`, que no aplica a rutas fuera de ese grupo).
- Contiene bastante `console.log` de debug (con emojis) en cada rama — dejado en el código, no es solo de desarrollo.

**Gating de suscripción** (`src/app/(app)/layout.tsx`, client component):
- Llama a `useSubscriptionStatus()` al montar. Mientras no está `initialized`, muestra "Verificando suscripción..." sin sidebar.
- Si `sessionStorage['fromLogin'] === '1'` (seteado por `LoginForm` justo tras login exitoso), redirige **silenciosamente** (sin toast) a la pantalla de suscripción correspondiente y limpia el flag.
- En cualquier otro caso (deep link, cambio de estado en caliente), muestra un `toast.error` y redirige — solo una vez por montaje (`didToast` ref).
- Si el estado no es válido, el layout renderiza `null` mientras el `useEffect` async decide el redirect — puede haber un flash de contenido en blanco.

## Autenticación

**Cliente HTTP** (`src/lib/api.ts`):
- `baseURL = NEXT_PUBLIC_API_URL` (default `http://localhost:8000`); en producción fuerza `https://` si la URL no es `localhost`.
- `withCredentials: true`.
- Interceptor de request: busca el token en orden cookie `access_token` → `localStorage['access_token']` → `localStorage['token']`, y setea `Authorization: Bearer <token>`.
- **Sin interceptor de respuesta**: no hay refresh automático de token ni redirect global en 401 — cada hook maneja sus errores por su cuenta.

**Login** (`LoginForm.tsx`): `POST /auth/login` (form-urlencoded, estilo OAuth2). Al éxito, el token se escribe en **tres lugares**: store de Zustand (→ `localStorage['token']`), cookie `access_token` (7 días, `secure` en prod), y `localStorage['access_token']`. Setea `sessionStorage['fromLogin']='1'` y navega a `/summary`.

**Registro** (`RegisterForm.tsx`): `POST /auth/register` `{email, password}`. **No hay auto-login** tras registrarse — el usuario vuelve al tab de login. El mensaje de éxito indica que la cuenta necesita una suscripción activa (aprovisionamiento manual/admin, no self-serve).

**Recuperar contraseña** (`ForgotPasswordForm.tsx`): `POST /auth/forgot-password`. El tab correspondiente en `AuthPanel.tsx` está **comentado en la UI** (no se puede llegar a este formulario desde la interfaz actual salvo que se reactive el botón).

**Estado de suscripción** (`useSubscriptionStatus.ts`): `GET /subscriptions/me`. Prioridad de estado: `end_date` vencida → `expired` (incluso si `is_active` es true) → `!is_active` → `inactive` → vence en ≤7 días → `expiring_soon` → si no, `active`. 401/404 → `none`. Otros errores no degradan el estado (evita falsos negativos por errores transitorios), pero si el primer request falla con algo distinto de 401/404, el estado puede quedar atascado indefinidamente en `loading`.

**Logout**: implementado por separado en `Header.tsx`, `Sidebar.tsx` y cada pantalla `auth/expired|inactive|no-subscription` (código duplicado en vez de una función compartida). Limpia el store de Zustand y la cookie, pero **no limpia `localStorage['access_token']`**.

## Estado y fetching de datos

- **Zustand**: `useAuthStore` (token) y `useSidebarStore` (sidebar móvil). No hay un store global de datos de dominio.
- **Sin caché de servidor compartida** (no React Query): cada feature tiene su propio hook `useState`+`useEffect`+axios con `loading`/`error`/`refresh()` manual. Única excepción: `useDebts.ts` usa **SWR** (revalida on focus/reconnect), inconsistente con el resto.
- **Formularios**: todos manuales (`useState` por campo + validación a mano + `toast.error`), pese a tener `react-hook-form`/`zod`/`form.tsx` instalados y sin usar.
- Los inputs de monto/tasa usan `react-number-format` (`NumericFormat`) para separadores de miles/decimales según locale.

## Fechas y monedas

Dos estrategias de parámetros de fecha coexisten (a tener en cuenta al tocar filtros):
- **Summary / cash-flow**: fechas simples `YYYY-MM-DD` como `start_date`/`end_date` (`src/lib/dateParams.ts`).
- **Transactions**: límites completos en UTC como `startDate`/`endDate` (camelCase), convertidos desde el día local del navegador (`toUtcDayBoundsFromISOStrings`), para que el filtrado respete el día calendario local, no UTC crudo.

El patrón "fecha a mediodía local en ISO" (`dateToIsoAtLocalNoon` / `toIsoAtLocalNoon`) para evitar corrimientos de día por timezone está **copiado en al menos 4 lugares** distintos (`utils/dates.ts`, `NewTransactionModal.tsx`, `EditTransactionModal.tsx`, `PayDebtModal.tsx`) en vez de centralizado.

`formatCurrency` (`src/lib/format.ts`) siempre muestra 0 decimales y el mismo símbolo `$` para COP y USD — la distinción de moneda depende de que el componente que llama añada el código de moneda como texto aparte.

Solo se soportan dos monedas en el tipo `currencyType` del frontend (`"COP" | "USD"`), aunque el backend además contempla `EUR` en varios de sus modelos/respuestas.

## Features principales

- **Resumen** (`(app)/summary`): combina 5 hooks independientes en paralelo (`useSummary`, `useAssetsSummary`, `useLiabilitiesSummary`, `useNetWorthSummary`, `useCashFlowSummary`), cada uno con su propio fetch — sin caché compartida entre ellos. Muestra KPIs, totales, gráfico de área (`AreaIncomeExpense`) y dos donuts por categoría (`DonutByCategory`). `SummaryLineChart.tsx` y `SummaryPieChart.tsx` existen pero **no se usan** en ninguna página (código muerto/iteración anterior).
- **Transacciones** (`(app)/transactions`): tabla (`@tanstack/react-table` vía `data-table.tsx`) + vista mobile en cards. Reglas de edición/reversión repetidas en `columns.tsx` y `page.tsx`: editable solo si es manual (sin `source_type`, no cancelada, no reversión, no compra con tarjeta); reversible si no cancelada, no ya reversada, y no es `transfer`. Crear una transacción de tipo `expense` permite elegir entre cuenta bancaria o tarjeta de crédito (prefijo `debt-<id>` en el picker) — en ese caso se llama `POST /debts/{id}/purchase` en vez de `POST /transactions`.
- **Cuentas de ahorro** (`(app)/saving-accounts`): agrupa por `type` (cash/bank/investment) + sección de cerradas. Política de acciones basada en si la cuenta tiene transacciones (`has-transactions`, cacheado localmente por cuenta): eliminar/editar-todo requieren "prístina" (sin transacciones), cerrar requiere balance 0, reabrir requiere estar cerrada. `WithdrawFromAccountModal.tsx` existe pero **no está enlazado a ningún botón** en la UI actual (el botón "Depositar" también está comentado en `AccountsSection.tsx`).
- **Deudas** (`(app)/debts`): agrupa por `kind` (loan/credit_card) + cerradas. "Pristina" = `transactions_count === 0`. Pagar (`PayDebtModal`) solo permite cuentas activas de la **misma moneda** que la deuda. "Agregar cargo" (`AddChargeToDebtModal`) incrementa el saldo sin tocar ninguna cuenta.
- **Categorías** (`(app)/categories`): lista activas/inactivas; las de sistema (`is_system`) están bloqueadas para editar/desactivar desde la UI. Desactivar = soft-delete (`DELETE`), con confirmación vía `ConfirmCategoryStatusModal`.

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

- `Header.tsx` no se usa en `(app)/layout.tsx` (que renderiza `Sidebar` + un FAB propio) — duplica la lógica de logout de `Sidebar.tsx`.
- `MobileSidebarTrigger.tsx` parece duplicar el FAB ya codificado inline en `(app)/layout.tsx`.

Vale la pena confirmar con una búsqueda de imports antes de eliminar cualquiera de los dos, por si se usan en algún lugar no cubierto en este análisis.
