# Panel de administración — mapa emergencia rescate

App Next.js 16 + React 19 independiente para operadores y administradores.
Corre en `:3001` y se comunica con el backend vía su propio BFF (`app/api/*`).
**No comparte código con `frontend/`.**

---

## Arrancar en local

```bash
docker compose up --build -d
# panel en http://localhost:3001
# email:    oaba.dev@gmail.com
# password: localadminpass123
```

Para correr solo el admin sin Docker:

```bash
cd admin
cp .env.example .env.local   # ajustar EMERGENCY_API_URL al backend local
npm install
npm run dev
```

Comandos útiles:

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run build       # build de producción
npx vitest run      # suite de tests (~4 s)
```

---

## Mapa rápido — dónde tocar cada cosa

### Agregar una nueva sección de tabla (el caso más común)

La mayoría de las secciones (Reportes, Desaparecidos, Donaciones…) son la
misma `ModelTable` genérica. Para agregar una nueva:

**1. Registrar el modelo** en `src/contexts/models/model-registry.ts`:

```ts
{
  path: "mi-modelo",          // debe coincidir con GET /api/public/mi-modelo en el backend
  label: "Mi Módulo",
  readCapability: "mimodelo:read",
  columns: [
    { key: "id",     label: "ID",     variant: "id" },
    { key: "nombre", label: "Nombre" },
    { key: "estado", label: "Estado", variant: "badge" },
  ],
}
```

**2. Agregar el ítem de navegación** en `src/config/nav.ts`:

```ts
{ id: "mi-modelo", label: "Mi Módulo", readCapability: "mimodelo:read" }
```

**3. Agregar el ícono** en `src/config/nav-icons.tsx` (clave = el `id` de arriba).

**4. Asegurarse de que el backend exponga** `GET /api/public/mi-modelo` con la
capacidad `mimodelo:read` en `backend/src/auth/capabilities.ts`.

La ruta `/mi-modelo` ya existe vía `app/[model]/page.tsx` — no hay que crear nada más.

---

### Agregar una página con lógica propia

Cuando la sección necesita más que una tabla (formularios, acciones, flujos
múltiples), creás una carpeta propia:

```
app/
└── mi-seccion/
    ├── page.tsx          ← Server Component (punto de entrada Next.js)
    └── mi-seccion.tsx    ← Client Component con la lógica
```

`page.tsx` es mínimo: solo importa el client component y opcionalmente define
metadata. La lógica vive en el client component, que usa `RequireCapability`
para proteger la vista. Seguí el patrón de `app/users/` o `app/roles/`.

---

### Agregar una ruta BFF

El navegador **nunca** llama al backend directamente. Toda petición pasa por
`app/api/*`, que lee la cookie `admin_session` y reenvía el JWT al backend.

Para agregar un endpoint BFF nuevo:

```
app/api/
└── mi-recurso/
    └── route.ts
```

Usá los helpers de `app/api/_shared/proxy.ts`:

```ts
import { json, mapApiError } from "../_shared/proxy";
import { authedFetch } from "@/shared/http/authed-fetch";

export async function GET(req: Request) {
  const res = await authedFetch("/api/public/mi-recurso", req);
  if (!res.ok) return mapApiError(res);
  return json(await res.json());
}
```

Si la respuesta puede cachearse, agregá las cabeceras de `bff-cache.ts`.

---

### Agregar un hook de datos

Los hooks viven cerca de su contexto de dominio, en `src/contexts/<dominio>/`.

```ts
// src/contexts/mi-dominio/use-mi-recurso.ts
export function useMiRecurso() {
  return useQuery({
    queryKey: ["mi-recurso"],
    queryFn: () => authedFetch("/api/mi-recurso").then(r => r.json()),
  });
}
```

No dupliques `fetch` manual si ya existe un hook equivalente en otro contexto.

---

### Agregar un átomo de UI

Los átomos van en `src/ui/atoms/`. Usá las clases de `src/ui/tokens.ts` para
colores y variantes (no escribas valores Tailwind directos — los tokens son la
fuente de verdad visual del panel).

```ts
// src/ui/atoms/mi-componente.tsx
import { cn } from "@/lib/utils";
import { tokens } from "@/ui/tokens";

export function MiComponente({ ... }) { ... }
```

Exportalo desde `src/ui/index.ts` y agregá el test en `tests/ui-atoms/`.

---

### Cambiar la navegación

- **Estructura / orden:** `src/config/nav.ts` (clusters e ítems).
- **Íconos:** `src/config/nav-icons.tsx` (clave = `id` del ítem).
- **Filtrado por capacidad:** automático vía `filterNavByCapabilities` — solo
  cambiá la propiedad `readCapability` del ítem.

Los tests de `tests/lib/nav-helpers.test.ts` verifican el filtrado y la
resolución de la ruta activa.

---

## Estructura de carpetas

```
admin/
├── app/                        ← rutas Next.js App Router
│   ├── layout.tsx              ← raíz: Providers + fuente
│   ├── shell.tsx               ← layout autenticado: sidebar + top-nav
│   ├── home.tsx                ← pantalla de inicio
│   ├── [model]/                ← tabla genérica (reportes, desaparecidos…)
│   ├── users/                  ← gestión de usuarios
│   ├── roles/                  ← gestión de roles y capacidades
│   ├── invite/[token]/         ← flujo aceptar invitación por email
│   └── api/                    ← BFF: proxean peticiones al backend
│       ├── _shared/            ← json(), mapApiError(), cabeceras caché
│       ├── auth/               ← login, logout, me
│       ├── admin/              ← users, roles, capabilities, invite
│       └── models/[path]/      ← proxy genérico a /api/public/*
│
└── src/                        ← código compartido entre rutas
    ├── config/
    │   ├── nav.ts              ← declaración de navegación
    │   └── nav-icons.tsx       ← íconos SVG por id de ítem
    ├── contexts/               ← bounded contexts por dominio
    │   ├── models/             ← tabla genérica (registry, gateway, UI)
    │   ├── roles/
    │   ├── users/
    │   └── invitations/
    ├── shared/
    │   ├── auth/               ← sesión RBAC (context, provider, gate, login)
    │   └── http/               ← HttpClient + authed-fetch (BFF → backend)
    └── ui/                     ← sistema de diseño
        ├── tokens.ts           ← clases Tailwind para variantes
        └── atoms/              ← Button, Input, Badge, MetricCard
```

---

## Cómo funciona — resumen rápido

1. **BFF pattern.** El navegador llama a `app/api/*` (mismo origen). El BFF
   lee la cookie `admin_session`, extrae el JWT y lo reenvía al backend como
   `Authorization: Bearer`. El backend hace la autorización real.

2. **RBAC por capacidades.** Cada usuario tiene un rol con capacidades
   (`report:read`, `user:invite`, …). `can(cap)` oculta UI; el backend bloquea
   si falta la capacidad.

3. **Modelo genérico.** La mayoría de las secciones son la misma `ModelTable`
   configurada desde `model-registry.ts`. Añadir una sección = una entrada en
   el registro.

4. **Navegación declarativa.** `nav.ts` define clusters e ítems.
   `filterNavByCapabilities` filtra según el `can()` del usuario en tiempo de
   render.

5. **Sin estado server-side en el cliente.** TanStack Query maneja cache y
   deduplicación. Cada hook hace `authedFetch` al BFF y devuelve
   `{ data, isLoading, isError }`.

Para entender en profundidad el diseño del sistema (diagramas de capas, flujo
de auth, RBAC, sidebar, dark mode, sistema de diseño y más) ver
**[docs/architecture.md](docs/architecture.md)**.

---

## Tests

```bash
npx vitest run              # todos
npx vitest run tests/lib    # solo nav-helpers
npx vitest --ui             # interfaz visual
```

Al agregar funcionalidad nueva: creá el test espejo en `tests/` siguiendo la
misma estructura de `src/`. Los tests de rutas BFF mockean `fetch`; los de
átomos usan Testing Library.
