# 0005 — Microservicio del dashboard de administración (multi-API)

> Estado: propuesta · Autor: Victor · Relacionado: — (sustituye al panel
> embebido en `app/admin/AdminDashboard.tsx`)

## Resumen (TL;DR)

Extraemos el panel `/admin` actual a un **microservicio frontal nuevo**,
construido con DDD, SOLID, Clean Code y un design system atómico. Vive en un
**monorepo Turborepo** propio, está hecho en **Next.js 16** y consume las APIs
existentes a través de una **capa BFF** propia. La arquitectura está pensada
para **múltiples APIs**: hoy la API de emergencias (este repo) y, a corto plazo,
una segunda API de **insumos de admin**. El panel actual no se toca hasta que el
nuevo alcanza paridad; entonces se retira.

## Contexto y motivación

El panel vive hoy en [`app/admin/AdminDashboard.tsx`](../../app/admin/AdminDashboard.tsx):
un único client component de ~1.500 líneas que mezcla, sin separación de capas:

- fetch a 4 endpoints admin + 1 público (federación),
- polling con `setInterval` + `visibilitychange` (repetido 5 veces),
- estado, búsqueda y filtrado en memoria,
- actualizaciones optimistas a mano,
- render de métricas, tablas, sincronización, duplicados y exportación CSV.

Problemas: una sola responsabilidad gigante, lógica de datos acoplada a la UI,
imposible de testear por unidades, y **atado a una sola API** (rutas relativas
del propio Next). Se pide un frontal **separado**, reutilizando la API actual,
y **preparado para varias APIs** (la de insumos llegará después).

Dos restricciones técnicas detectadas en el código actual condicionan el diseño:

1. **No hay CORS** en las rutas (`app/api/**`). Un frontal en otro origen no
   puede llamar directamente a esta API sin modificar este backend.
2. **El "token" admin es la contraseña en claro** ([`lib/admin.ts`](../../lib/admin.ts)):
   el login solo valida `ADMIN_PASSWORD`; el navegador guarda esa contraseña en
   `sessionStorage` y la reenvía como `x-admin-token` en cada petición.

El patrón **BFF** (Backend For Frontend) resuelve (1) — el navegador habla solo
con su propio origen — y permite ocultar en el servidor los secretos de las APIs
que lo necesiten (p. ej. la futura de insumos), sin tocar el backend ajeno.

## Objetivos

- Frontal del panel admin como microservicio independiente y desplegable.
- Reutilizar la API de emergencias **tal cual** (sin cambios en este repo).
- Abstracción **multi-API** de primera clase: añadir una API es declarativa.
- Dejar montado el **bounded context de insumos** listo para enchufar su API.
- Separación de capas testeable (dominio, aplicación, infraestructura, UI).
- Design system atómico reutilizable, agnóstico de dominio.
- Migración **incremental** en PRs pequeños; el panel viejo sigue operativo.

## No-objetivos

- No reescribir ni migrar el backend de emergencias.
- No cambiar el modelo de datos ni las migraciones (Drizzle/Neon).
- No introducir CQRS, event sourcing, repos genéricos especulativos,
  Storybook ni una librería de estado global. (Ver "Qué dejamos fuera".)
- No mejorar el esquema de autenticación en esta iteración (decisión explícita,
  ver más abajo).

## Decisiones tomadas

| Tema | Decisión |
| --- | --- |
| Alcance | Extraer **todo** el panel `/admin` + dejar hueco para insumos |
| Stack | **Next.js 16** (App Router) + capa **BFF** propia |
| Ubicación | **Monorepo Turborepo** en `dashboard/` dentro de este repo (rama aparte); APIs externas por HTTP |
| API insumos | **Ya existe / contrato lo aporta el autor** (2º gateway) |
| Estado servidor | **TanStack Query** (polling + cache + optimistic) |
| Auth | **Replicar el esquema actual** (passthrough de `x-admin-token`) |
| Idioma | **Código en inglés**; UI y documentación en **español** |
| Formato | **Prettier** (config compartida en `packages/config`) |
| Linter | **ESLint 9** (flat) + `eslint-config-next` + reglas de límites de import |
| Testing | **Vitest** + Testing Library + **MSW**; metodología **TDD** |
| Mocking | Solo el borde de I/O más externo (red HTTP vía MSW); nada interno |

## Arquitectura

### Monorepo

El código vive en `dashboard/` **dentro de este repo** (en una rama de trabajo),
como un monorepo Turborepo autónomo. En **runtime** sigue siendo un servicio
aparte: se despliega por separado y consume las APIs (emergencias e insumos) como
**servicios externos** por HTTP; el BFF llama a la API de emergencias
servidor-a-servidor (sin CORS).

```text
dashboard/                       # raíz del monorepo Turborepo (dentro de este repo)
  apps/
    web/                         # Next.js 16 — UI + BFF (microservicio desplegable)
  packages/
    ui/                          # Design System (Atomic Design), agnóstico de dominio
    contracts/                   # DTOs/tipos compartidos (ideal: generados del OpenAPI)
    config/                      # presets de tsconfig, eslint, tailwind
```

### Capas por bounded context (DDD pragmático)

Organización **por contexto de dominio**, no por tipo de fichero. DDD con
mesura: modelo rico solo donde hay reglas; en listados/CRUD el caso de uso es
delgado (orquesta gateway + mapper).

```text
apps/web/
  app/
    (panel)/...                  # páginas del panel (Server Components + islas cliente)
    api/                         # BFF: route handlers (auth passthrough + proxy + agregación)
  src/
    config/api-registry.ts       # registro declarativo de APIs
    shared/
      http/http-client.ts        # cliente fetch por API (baseUrl, auth, get/post, errores→Result)
      auth/                      # lectura del token de sesión y guard de rutas BFF
      result.ts                  # Result<T,E> para errores explícitos
    contexts/
      reports/
        domain/                  # entidad Report, value objects, reglas
        application/             # casos de uso: listReports, removeReport, …
        infrastructure/          # ReportsGateway (puerto) + adaptador HTTP + mapper DTO→dominio
        ui/                      # organisms de dominio: ReportsTable, ReportRow
      missing/  chat/  donations/  contact/  sync/  federation/
      supplies/                  # ← insumos: bounded context nuevo, 2º gateway
```

**SOLID aplicado**

- **SRP**: cada contexto y cada capa tiene una responsabilidad única.
- **OCP/DIP**: cada contexto expone un **puerto** (interfaz `XGateway`); el
  adaptador HTTP lo implementa recibiendo el `HttpClient` correcto. Añadir la API
  de insumos = nueva entrada en el registry + un adaptador; nada más cambia.
- **ISP**: puertos pequeños por contexto, no un "súper-repositorio".
- **Boundaries por lint**: reglas ESLint que prohíben las importaciones que
  rompen capas (`domain`/`application` no importan de `infrastructure`/`ui`;
  `packages/ui` no importa de `contexts/*`). La arquitectura se vigila sola.

### Capa multi-API (núcleo de "preparado para múltiples APIs")

Registro declarativo de APIs:

```ts
// config/api-registry.ts
export const API_REGISTRY = {
  emergency: { baseUrl: env.EMERGENCY_API_URL, auth: "admin-token" },
  supplies:  { baseUrl: env.SUPPLIES_API_URL,  auth: "supplies" },
} as const;

export type ApiId = keyof typeof API_REGISTRY;
```

`HttpClient` es una pieza por entrada del registry: fija `baseUrl`, aplica la
estrategia de auth (`get`/`post`) y normaliza errores a `Result` (nunca lanza).
Cada contexto recibe el cliente de **su** API por inyección. (`patch`/`delete` se
añadirán con las acciones de F4, cuando haya callers.)

Flujo con BFF (elimina CORS; cada gateway corre en servidor):

```text
Browser ──(mismo origen, x-admin-token)──► BFF ──gateway emergencias──► API emergencias
                                              └──gateway insumos──────► API insumos
```

El navegador solo conoce rutas del BFF. El gateway de cada API añade su
credencial del lado servidor (la de insumos puede ser secreto de servidor; la de
emergencias se reenvía, ver Auth).

### BFF y autenticación (passthrough — se replica el esquema actual)

Decisión explícita: **no** introducimos cookie httpOnly en esta iteración. Se
mantiene el comportamiento actual para no cambiar la superficie de seguridad:

1. Login: el navegador valida la contraseña contra `POST /api/auth/login` del
   BFF, que la reenvía a `POST /api/admin/login` de la API de emergencias.
2. El navegador guarda el token (la contraseña) en `sessionStorage`, como hoy.
3. En cada petición, el navegador manda `x-admin-token` al BFF y el BFF lo
   **reenvía** a la API de emergencias.

> Deuda conocida (fuera de alcance): el token sigue siendo la contraseña en
> claro en el navegador. El BFF deja la puerta abierta a migrar a cookie
> httpOnly + sesión firmada más adelante **sin** tocar el backend ajeno.

Para la API de insumos, su credencial se modela como secreto de servidor en el
registry salvo que su contrato exija otra cosa.

### Design System (Atomic Design) — `packages/ui`

Extraído de lo que ya existe (Tailwind v4, paleta slate/emerald/red…), sin
inventar estética nueva:

Construido hasta ahora: **tokens** mínimos (clases semánticas) y **atoms**
`Button`, `Input`, `MetricCard`. Pendiente (F2): más atoms (Badge, Card, Spinner,
Thumbnail), molecules (SearchBar, TabBar, StatPill, EmptyState) y organisms
genéricos (DataTable, ListPanel, AppHeader).

Regla dura: `packages/ui` **no conoce el dominio** (vigilado por lint). Los
organisms con lógica de negocio (p. ej. `ReportsTable`) viven en la app
(`contexts/*/ui`) y se componen con piezas de `ui`. Los tests viven en `tests/`
por workspace (convención del equipo), no colocados.

### Estado de servidor — TanStack Query

Sustituye el boilerplate actual (5 × fetch + `setInterval` + `visibilitychange`
+ optimistic a mano) por hooks declarativos por contexto:

- `useReports()` con `refetchInterval: 7000` y pausa en segundo plano nativa.
- `useRemoveReport()` (`useMutation`) con optimistic update + invalidación.

Los hooks llaman al BFF; el BFF llama a los gateways. La UI no conoce `fetch`.

## Superficie reutilizada y mapa de bounded contexts

Endpoints actuales que el panel consume (se reutilizan tal cual a través del BFF):

| Contexto | Lectura | Acciones |
| --- | --- | --- |
| reports | `GET /api/admin/data` | `DELETE /api/reports/:id` |
| missing | `GET /api/admin/data` | `DELETE /api/missing/:id`, `POST /api/missing/:id/restore` |
| chat | `GET /api/admin/data` | `DELETE /api/chat/:id` |
| donations | `GET /api/admin/donations` | export CSV (cliente) |
| contact | `GET /api/admin/contact` | `PATCH /api/admin/contact` (marcar leído) |
| sync | `GET /api/admin/data`, `GET /api/sync/duplicates` | `POST /api/sync/run?mode=chunk`, `POST /api/sync/reset` |
| federation | `GET /api/hub/stats` (público) | — |
| auth | `POST /api/admin/login` | — |
| **supplies** | _(contrato pendiente)_ | _(contrato pendiente)_ |

Nota: hoy `GET /api/admin/data` devuelve un agregado (reports + messages +
people + sync). En el BFF se mantiene ese agregado para la primera fase y, si
conviene, se separa por contexto en fases posteriores sin cambiar la API.

## Calidad: formato, linter y testing (TDD)

Toda pieza nueva se construye en **TDD** (red → green → refactor): primero el
test que falla, luego el mínimo código que lo pasa, luego el refactor con la red
en verde.

**Herramientas** (config compartida en `packages/config`):

- **Formato**: Prettier (`format` y `format:check`).
- **Linter**: ESLint 9 (flat config) + `eslint-config-next` + reglas de límites
  de import (ver Boundaries) + accesibilidad (`jsx-a11y`).
- **Tests**: Vitest (ya usado en el repo) + `@testing-library/react` (+ jsdom) +
  **MSW** (Mock Service Worker) para el borde de red.
- **Pre-commit**: husky + lint-staged (formato + lint sobre lo *staged*), como el
  repo actual.
- **CI** (GitHub Actions): `format:check` + `lint` + `typecheck` + `test` en
  cada PR.

### Regla de mocking: solo la última parte posible

Los tests ejercitan **código real** de todas las capas y mockean **únicamente el
borde de I/O más externo**: la respuesta HTTP de las APIs. Nunca se mockean
colaboradores internos (casos de uso, gateways, mappers, hooks, stores).

- **Lo que se mockea**: la red. MSW intercepta `fetch` y responde como lo haría
  la API real. Es lo "último posible" antes de salir del proceso.
- **Lo que queda real**: dominio, casos de uso, gateways, mappers, `HttpClient`,
  hooks de TanStack Query y componentes.

Ejemplos por capa:

- **Caso de uso**: `listReports()` corre el use case real → gateway HTTP real →
  mapper real → `HttpClient` real; MSW finge `GET {EMERGENCY_API_URL}/api/admin/data`.
  Se verifica el `Report[]` de dominio resultante.
- **UI (organism)**: `ReportsTable` se monta con Testing Library; el usuario
  interactúa de verdad; hooks y TanStack Query reales; MSW finge el BFF.
- **BFF (route handler)**: se invoca el handler real; MSW finge las APIs externas
  aguas abajo (emergencias / insumos).

Única dependencia que se inyecta (no es mock de lógica): reloj e ids/aleatoriedad
se pasan como dependencia para tests deterministas (`Date.now`, generación de id).

E2E (Playwright) se introduce en **F6**, no antes (YAGNI hasta tener el flujo
completo).

## Plan de migración por fases (PRs pequeños, como pide AGENTS.md)

- **F0 — Scaffold**: monorepo Turborepo, `apps/web` (Next 16),
  `packages/ui`, `packages/contracts`, `packages/config`, y tooling: TS strict,
  ESLint + Prettier, Vitest + Testing Library + MSW, Tailwind preset, husky +
  lint-staged, y CI (format/lint/typecheck/test). **Un primer test en verde fija
  el andamiaje de TDD.**
- **F1 — Plataforma de datos**: BFF + auth passthrough + `HttpClient` +
  `api-registry` + gateway de emergencias (lectura).
- **F2 — Design system base**: tokens + atoms + molecules.
- **F3 — Pestañas de lectura**: analytics (embed OpenPanel), métricas,
  federación → paridad visual con el panel actual.
- **F4 — Acciones**: mutations (eliminar, restaurar, marcar leído, sync
  run/reset, duplicados) con optimistic updates.
- **F5 — Insumos**: bounded context `supplies` con el contrato aportado;
  segundo gateway en el registry.
- **F6 — Hardening**: cobertura de mappers/gateways/casos de uso, e2e del flujo
  admin con **Playwright**, accesibilidad, y retirada del `/admin` viejo
  (redirección o borrado).

Cada fase es un spec/plan + PR enfocado y revisable.

## Riesgos y mitigaciones

- **Paridad funcional incompleta** → checklist por pestaña contra el panel
  actual antes de retirar `/admin`.
- **Doble fuente de verdad temporal** (panel viejo y nuevo conviven) → el viejo
  permanece read/write hasta F6; el nuevo se valida en paralelo.
- **Contrato de insumos desconocido** → F5 se planifica al recibir el OpenAPI;
  no bloquea F0–F4.
- **Acoplamiento accidental del design system al dominio** → regla de import
  (lint) que prohíbe que `packages/ui` importe de `contexts/*`.

## Qué dejamos fuera (YAGNI)

CQRS, event sourcing, repositorios genéricos especulativos, Storybook y librería
de estado global (Redux/Zustand). TanStack Query + estado local cubren el caso.
Si alguno se justifica más adelante, se añade entonces.

## Preguntas abiertas

1. **Contrato de la API de insumos** (OpenAPI o lista de endpoints + auth) para
   planificar F5.
2. **Despliegue del microservicio**: ¿Vercel (como el repo actual) o el mismo
   destino Hetzner/k3s del backend? (No bloquea F0–F4.)
3. ¿El agregado `GET /api/admin/data` se mantiene o se divide por contexto en el
   BFF a partir de F3?
