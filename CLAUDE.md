# Contexto para trabajar en este repo

Frontend de **Balanced Cent**, app de finanzas personales en español. Next.js 15 (App Router) + React 19 + TypeScript, desplegado en Vercel (`www.balancedcent.com`). El backend es un repo hermano (`../backend`, FastAPI en Fly.io).

**La documentación de referencia está al día — leerla antes de asumir cómo funciona algo:**

| | |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Routing, auth, estado, cada feature en detalle, sistema de diseño |
| [README.md](README.md) | Setup, stack, variables de entorno, scripts |
| `../backend/docs/PENDIENTES.md` | Lista viva de tareas — cubre **ambos** repos |
| `../backend/docs/PLAN_CATEGORIAS_V2.md` | El modelo de categorías: por qué es como es |

## Lo que hay que saber antes de tocar código

**Las categorías son un árbol de dos niveles y el primer nivel no recibe dinero.** Un grupo (`parent_id IS NULL`) agrupa; una hoja (`parent_id NOT NULL`) es la que recibe movimientos. Consecuencias directas:

- Un selector de categoría **solo ofrece hojas** (`postableCategories`, `lib/categoryTree.ts`). Ofrecer un grupo es ofrecer un error que el backend rechaza al guardar.
- Para mostrar el nombre usar **siempre** `categoryDisplayName(c, todas)`, nunca `c.name`: la hoja que crea el backend se llama «General» y el usuario nunca debe verla. Resuelve el grupo por `parent_id` contra el árbol, porque `parent_name` **solo lo rellena `GET /categories`** — la categoría embebida en una transacción no lo trae.
- Un grupo cuya **única** hoja es la sintética se colapsa en una sola línea (lista, selector y drill-down del Resumen, todos con la misma regla, o la app se contradice). Solo se colapsa la hoja *sintética*: hacerlo por «una sola hoja» hacía desaparecer una subcategoría recién creada por el usuario.
- Al crear una subcategoría **no se pregunta el tipo**: lo hereda del grupo.

Toda esa lógica vive en `lib/categoryTree.ts`, con 32 tests. Es la capa donde ya se colaron dos bugs visibles; no reimplementarla en un componente.

⚠️ **Las acciones de una transacción viven en DOS árboles**: la tabla de escritorio (`(app)/transactions/columns.tsx`) y las cards de móvil (`(app)/transactions/page.tsx`, bloque `md:hidden`). Agregar una en uno y olvidarla en el otro la deja invisible en ese viewport **sin ningún error**. Ya pasó con el botón de comprobantes y con el atajo de reglas. `acciones-movil.test.tsx` lo previene: en jsdom no aplican las media queries, así que ambos árboles se montan y el test exige que cada acción común aparezca **dos veces**.

**La sesión vive en una cookie httpOnly** que fija el backend. El frontend nunca lee ni guarda el JWT. Para cerrar sesión, siempre `logout()` de `lib/api.ts` — nunca manipular cookies o storage a mano. `JWT_SECRET` debe coincidir con `SECRET_KEY` del backend.

**Un estado vacío casi nunca es uno solo.** «Todavía no has registrado nada» y «tus filtros no devuelven nada» se ven igual y piden acciones opuestas; ofrecer la equivocada deja al usuario buscando un botón que no le sirve. Y la acción tiene que **hacer** algo: un botón «volver al rango por defecto» estando ya en él es un botón muerto.

**No hay caché de servidor compartida.** Cada feature tiene su hook `useState`+`useEffect`+axios. Tras una escritura que afecte saldos o movimientos, llamar `notificarCambioDeDatos()` (`lib/dataRefresh.ts`) — **nunca `window.location.reload()`**, que tira scroll, filtros y formularios abiertos.

**Los modales usan un `Dialog` propio sobre Headless UI**, no Radix Dialog. Radix pone `pointer-events: none` en el `<body>` mientras un `Select` suyo está abierto, y eso hacía que el segundo toque en móvil cerrara el modal entero; `DialogContent` ignora los cierres con esa firma exacta. No deshacer ese guard.

## Cómo se trabaja acá

- **Comentarios, textos de interfaz y mensajes de commit en español**, explicando el **porqué** y no el qué. Un mensaje de error dice qué pasó *y qué hacer*.
- **Vitest + Testing Library**, tests junto al código (`x.test.ts` al lado de `x.ts`). 157 tests. Se cubre la lógica pura donde una regresión sería silenciosa y cara, no cobertura por cobertura.
- **Cada defecto corregido se verifica por mutación**: revertir el arreglo y confirmar que al menos un test falla.
- **Verificar en un navegador real, no solo con tests.** Los bugs más visibles de este proyecto son estructuralmente invisibles para jsdom: jsdom no tiene motor de layout ni aplica media queries. Comprobar también a 390px de ancho.
- Formularios con `useState` manual por campo. `react-hook-form`/`zod` están instalados pero **no se usan**; no adoptarlos a medias.
- CI (`.github/workflows/ci.yml`): typecheck → tests → build. Vercel despliega por su cuenta, así que el workflow avisa pero no bloquea.
