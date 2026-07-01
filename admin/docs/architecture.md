# Arquitectura del panel de administración

Documento de referencia para entender **por qué** el admin está diseñado así.
Para el "cómo hacer cosas" (comandos, recetas, estructura de carpetas) ver el
[README](../README.md).

---

## Por qué existe como app separada

El admin es una app Next.js 16 + React 19 independiente que corre en el puerto
`3001`. No comparte código con `frontend/` — la separación es deliberada:

- **Auth propia**: sesión basada en JWT httpOnly cookie, distinta al flujo
  del sitio público.
- **Tokens CSS propios**: paleta y radios adaptados al dashboard, sin afectar
  el sitio público.
- **Deploy independiente**: se puede actualizar sin tocar el frontend.
- **Único backend compartido**: todo pasa por `backend/src/` vía BFF.

---

## Diagrama de capas

```
Navegador (localhost:3001)
        │
        │  fetch mismo origen
        ▼
┌───────────────────────────────┐
│  app/api/*                    │  BFF — Next.js Route Handlers
│  Lee cookie admin_session     │
│  → Authorization: Bearer JWT  │
└───────────────┬───────────────┘
                │  HTTP
                ▼
┌───────────────────────────────┐
│  backend/src/                 │  Express API
│  requireCapability() gatea    │
│  toda mutación y lectura      │
└───────────────┬───────────────┘
                │  Drizzle ORM
                ▼
           Postgres
```

---

## Patrón BFF

El navegador **nunca** llama al backend directamente. Toda petición pasa por
`app/api/*`, que actúa como proxy autenticado:

1. Lee la cookie `admin_session` (httpOnly — inaccesible desde JS, protege
   contra XSS).
2. Extrae el JWT y lo reenvía como `Authorization: Bearer <token>`.
3. Mapea el status HTTP del backend sin transformar la respuesta.
4. **No contiene lógica de negocio** — eso es responsabilidad del backend.

Helpers compartidos en `app/api/_shared/`:

| Archivo | Qué hace |
|---|---|
| `proxy.ts` | `json(body, status)` y `mapApiError(error)` — mapeo de errores |
| `bff-cache.ts` | `Cache-Control: no-store` en todas las respuestas (datos sensibles) |

Patrón de un endpoint BFF típico:

```ts
// app/api/admin/audit/route.ts
export async function GET(req: Request) {
  const res = await authedFetch("/api/admin/audit", req);
  if (!res.ok) return mapApiError(res);
  return json(await res.json(), 200);
}
```

---

## Autenticación y sesión

### Flujo de login

```
LoginForm
  │  POST /api/auth/login { email, password }
  ▼
app/api/auth/login/route.ts (BFF)
  │  reenvía al backend
  ▼
backend /api/public/auth/login
  │  valida credenciales
  ├─ ← { token: "<jwt>" }
  ▼
BFF → Set-Cookie: admin_session=<jwt>; HttpOnly; SameSite=Lax
```

### Verificación de sesión (al cargar)

```
AdminSessionProvider
  │  GET /api/auth/me
  ▼
BFF → cookie → backend /api/auth/me
  │
  └─ ← { user: { id, email, isAdmin }, capabilities: ["report:read", …] }
```

### Componentes de auth

| Archivo | Responsabilidad |
|---|---|
| `src/shared/auth/admin-session-context.tsx` | Estado global: `user`, `capabilities`, `can()`, `login()`, `logout()` |
| `src/shared/auth/admin-gate.tsx` — `AdminGate` | Muestra `LoginForm` si no hay sesión activa |
| `src/shared/auth/admin-gate.tsx` — `RequireCapability` | Oculta UI si falta una capacidad (solo UX) |
| `src/shared/auth/login-form.tsx` | Formulario de login |

> `RequireCapability` es UX, no seguridad. El backend siempre aplica
> `requireCapability()` — aunque el cliente muestre la UI, el servidor bloquea
> si falta la capacidad.

---

## RBAC — capacidades y roles

El sistema de acceso se basa en **capacidades** (strings como `report:read`,
`user:invite`, `audit:read`). Cada usuario tiene un rol y cada rol tiene N
capacidades.

### Cómo funciona el check

```
can("audit:read")
  │
  ├─ si user.isAdmin → true  (admin tiene "*", cubre todo)
  └─ si capabilities.includes("audit:read") → true
```

### Dónde se aplica

| Capa | Mecanismo | Propósito |
|---|---|---|
| Sidebar | `filterNavByCapabilities(NAV_SECTIONS, can)` | Oculta ítems del nav |
| UI | `<RequireCapability cap="…">` | Oculta secciones/botones |
| BFF | Propaga el 403 del backend | Transparencia de errores |
| **Backend** | `requireCapability("…")` | **Autorización real** |

La primera línea de defensa **siempre es el backend**.

---

## Shell y layout

Todo el layout autenticado vive en `app/shell.tsx` — un único componente
`AuthedShell` que contiene:

### Sidebar — 3 modos

```
"expanded"  → ancho fijo 16rem, siempre visible
"collapsed" → ancho fijo 3.5rem, solo íconos + tooltips
"hover"     → rail de 3.5rem (reserva espacio en layout),
              aside absolute que se expande a 16rem al hover
```

El modo se persiste en `localStorage` bajo la clave `admin_sidebar_mode`.
En modo `hover`, el sidebar flota sobre el contenido (sin desplazarlo) gracias
a `position: absolute` dentro de un rail `position: relative`.

### Capas de z-index

```
sidebar mobile    z-40
chat panel        z-100
cmd backdrop      z-105
cmd palette       z-110
```

### Paneles y shortcuts

| Shortcut | Qué hace |
|---|---|
| `⌘K` / `Ctrl+K` | Abre la paleta de comandos (navegación rápida) |
| `⌘I` / `Ctrl+I` | Abre/cierra el panel de chat |
| `Esc` | Cierra todo (sidebar mobile, dropdowns, paleta, chat) |

### Dark mode

La clase `.dark` en `<html>` sobreescribe los tokens CSS definidos en
`app/globals.css`. No hay clases Tailwind nuevas — los mismos tokens cambian
de valor. Se activa desde el dropdown del avatar de usuario y se persiste en
`localStorage`.

---

## Patrón de modelos genéricos

La mayoría de secciones son la misma `ModelTable` configurada desde el
registro. El flujo completo:

```
src/contexts/models/model-registry.ts
  path, label, readCapability, columns[]
        │
        ▼
src/contexts/models/ui/model-table.tsx
  búsqueda accent-insensitive
  pills de filtro por columnas badge
  render por variante (text / badge / id)
        │  useModelList(path)
        ▼
app/api/models/[path]/route.ts   ← BFF genérico
        │  authedFetch
        ▼
backend GET /api/public/<path>
```

### Variantes de columna

| `variant` | Cómo se renderiza |
|---|---|
| `"text"` (default) | Texto plano |
| `"badge"` | Pill de color via `badgeStyle()` en `cell-format.ts` |
| `"id"` | Monoespaciado, truncado a 8 caracteres |

### `filterable: true`

Columnas con `filterable: true` y `variant: "badge"` generan **pills de filtro
rápido** en la toolbar de la tabla. Los valores posibles se derivan dinámicamente
de los datos reales.

---

## Genérico vs. página custom

| Situación | Enfoque |
|---|---|
| Vista de datos read-only, sin lógica propia | Modelo genérico en `model-registry.ts` |
| Formularios, acciones, flujos propios | Página custom en `app/<seccion>/` |

Una página custom sigue el patrón:

```
app/mi-seccion/
├── page.tsx          ← Server Component mínimo (metadata, imports)
└── mi-seccion.tsx    ← Client Component con <RequireCapability> y lógica
```

Ejemplos: `app/users/`, `app/roles/`, `app/audit/`.

---

## Contextos por dominio

El código compartido entre rutas vive en `src/contexts/`, organizado por
dominio. Cada contexto tiene sus propios hooks, componentes y (si aplica)
capas de aplicación e infraestructura.

| Contexto | Qué contiene |
|---|---|
| `models/` | Registry, gateway DDD (ui / application / infrastructure), `ModelTable`, `useModelList` |
| `roles/` | Lista, formularios de creación/edición, `CapabilityPicker`, `useRoles` |
| `users/` | `UsersTable`, `useUsers` |
| `invitations/` | `InviteForm`, `useInvite` |
| `chat/` | `ChatPanel` (panel deslizante ⌘I) |

El contexto `models/` es el más estructurado — sigue un DDD lite con capas
`ui → application → infrastructure` para separar la interfaz de la fuente de
datos.

---

## Sistema de diseño

Los tokens visuales viven en `app/globals.css` como variables CSS:

```css
:root {
  --canvas:        #eef2f7;   /* fondo de página */
  --surface:       #ffffff;   /* tarjetas, sidebar */
  --surface-muted: #f7f8f9;   /* hover, thead */
  --border:        #dde3eb;
  --text:          #0a1628;
  --text-muted:    #4a5568;
  --text-soft:     #94a3b8;
  /* brand, crisis, etc. */
}
```

Tailwind v4 los consume via `@theme inline`:

```css
@theme inline {
  --color-surface:  var(--surface);
  --color-etext:    var(--text);
  --color-border:   var(--border);
  /* … */
}
```

Esto genera utilidades como `bg-surface`, `text-etext`, `border-border`.

**Regla**: no usar valores hardcodeados (`gray-500`, `#fff`) en JSX ni CSS.
Siempre los tokens. Las variantes de componentes (Button, Badge) están en
`src/ui/tokens.ts`.

---

## Añadir una capacidad nueva — flujo completo

Para que una nueva sección aparezca en el sidebar y esté protegida, hay que
tocar estos 5 puntos (en este orden):

**1. Backend** — registrar la capacidad:
```ts
// backend/src/auth/capabilities.ts
"mi-modelo:read"
```

**2. BFF** — crear la ruta proxy (si no es tabla genérica):
```ts
// app/api/mi-recurso/route.ts
export async function GET(req: Request) {
  const res = await authedFetch("/api/public/mi-recurso", req);
  if (!res.ok) return mapApiError(res);
  return json(await res.json(), 200);
}
```

**3. Registry** — registrar el modelo (solo si es tabla genérica):
```ts
// src/contexts/models/model-registry.ts
{
  path: "mi-modelo",
  label: "Mi sección",
  readCapability: "mi-modelo:read",
  columns: [
    { key: "id",     label: "ID",     variant: "id" },
    { key: "nombre", label: "Nombre" },
    { key: "estado", label: "Estado", variant: "badge", filterable: true },
  ],
}
```

**4. Nav** — agregar el ítem:
```ts
// src/config/nav.ts
{ id: "mi-modelo", label: "Mi sección", href: "/mi-modelo", readCapability: "mi-modelo:read" }
```

**5. Ícono** — agregar el SVG:
```tsx
// src/config/nav-icons.tsx
"mi-modelo": <path d="…" />,
```

La ruta `/mi-modelo` ya existe via `app/[model]/page.tsx` — no hay que crear
nada más si es tabla genérica.
