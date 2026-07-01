# Primeros pasos para devs nuevos

Guía rápida para llegar a un entorno local funcional desde cero.

---

## Prerrequisitos


| Herramienta             | Versión mínima | Para qué                   |
| ----------------------- | -------------- | -------------------------- |
| Docker + Docker Compose | v24+           | stack completo local       |
| Node.js                 | v20 LTS        | correr paquetes sueltos    |
| Git                     | cualquiera     | clonar y trabajar en ramas |


No necesitás ninguna API key ni cuenta externa para levantar el stack base.

### Windows: clona el repo DENTRO de WSL2 (no en `C:\`)

Si desarrollás en Windows con Docker Desktop, el repo **debe vivir en el
filesystem de la distro WSL2** (ej. `/home/tuusuario/...`), NO en el filesystem
de Windows (`C:\Users\...`). Con el repo en `C:\`, Docker Desktop monta el
código a través de una capa de traducción (drvfs) que **no propaga los cambios
de archivo** al contenedor Linux: el hot reload nunca dispara (guardás y la
terminal de `docker compose` no muestra ningún `compiling`), y el arranque es
mucho más lento.

```bash
# En una terminal WSL2 (Ubuntu), NO en PowerShell:
cd ~                                   # /home/tuusuario  → filesystem de WSL2
git clone https://github.com/terremotovenezuela/mapa-emergencia-rescate.git
cd mapa-emergencia-rescate
code .                                 # abre VS Code con la extensión WSL
```

Editá los archivos desde ese VS Code (conectado a WSL). Así los eventos inotify
llegan al contenedor y el hot reload funciona sin necesidad de polling.

---

## Levantar el stack completo

```bash
git clone https://github.com/terremotovenezuela/mapa-emergencia-rescate.git
cd mapa-emergencia-rescate
docker compose up --build -d
```

El compose hace todo automáticamente:

1. Levanta Postgres + Valkey.
2. Corre el job `migrate-seed`: aplica migraciones y siembra datos demo
  (reportes de ejemplo, un superadmin, roles, capacidades).
3. Arranca el backend (Express `:8080`), el frontend público (Next `:3000`) y
  el panel admin (Next `:3001`).

Esperá a que `migrate-seed` complete antes de abrir el navegador. Podés
verificar con:

```bash
docker compose logs -f migrate-seed
# cuando veas "seed completado" o "omitido", ya está listo
docker compose logs -f backend
# cuando veas "listening on :8080", el backend está up
```

---

## URLs locales


| Servicio           | URL                                                              | Qué es                                                     |
| ------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------- |
| Sitio público      | [http://localhost:3000](http://localhost:3000)                   | mapa + reportes ciudadanos                                 |
| Backend API        | [http://localhost:8080](http://localhost:8080)                   | REST API (Express)                                         |
| Swagger / docs API | [http://localhost:8080/api-docs](http://localhost:8080/api-docs) | documentación OpenAPI                                      |
| Panel admin        | [http://localhost:3001](http://localhost:3001)                   | gestión de usuarios, roles y datos                         |
| Postgres           | localhost:5432                                                   | DB directa (usuario `mapa_app`, pass `localdev`, db `app`) |


---

## Credenciales locales

### Panel admin ([http://localhost:3001](http://localhost:3001))

El job `migrate-seed` crea un superadmin con:


| Campo      | Valor                |
| ---------- | -------------------- |
| Email      | `oaba.dev@gmail.com` |
| Contraseña | `localadminpass123`  |


Estas credenciales solo existen en tu entorno local (son el seed de Docker
Compose). No sirven en staging ni en prod.

### Sitio público ([http://localhost:3000](http://localhost:3000))

No requiere login. Podés reportar usando los formularios del mapa. Las
mutaciones públicas no piden Turnstile en local (la variable
`TURNSTILE_SECRET_KEY` está vacía, así que `requireHuman` deja pasar todo).

### Postgres directo

```bash
# psql desde el host
psql postgres://mapa_app:localdev@localhost:5432/app

# o entrando al contenedor
docker compose exec db psql -U mapa_app -d app
```

---

## Arquitectura en tres tiers

```
http://localhost:3000   →   frontend/     (Next.js, UI pública)
http://localhost:3001   →   admin/        (Next.js, panel admin — BFF propio)
http://localhost:8080   →   backend/      (Express, toda la lógica + API)
                                │
                       Postgres + Valkey  (dentro de Docker)
```

El **frontend público** y el **panel admin** son dos apps Next.js separadas que
nunca tocan la DB directamente: siempre hablan con el backend vía HTTP. El
panel admin tiene su propio BFF (`admin/src/`); el navegador llama same-origin
al BFF y este le habla al backend server-side.

---

## Variables de entorno

Para levantar con `docker compose up` **no necesitás crear ningún `.env`**: los
valores locales están embebidos en el `docker-compose.yml`.

Si querés correr piezas sueltas a mano (p.ej. `cd backend && npm run dev`),
copiá el ejemplo y ajustá lo necesario:

```bash
cp .env.example .env
# el archivo .env.example tiene comentarios que explican cada variable
```

Las únicas variables que cambian comportamiento notable en local son:


| Variable               | Efecto si la ponés                                            |
| ---------------------- | ------------------------------------------------------------- |
| `SMTP_HOST` + `SMTP_*` | el backend envía mails reales (invitaciones, OTP)             |
| `TURNSTILE_SECRET_KEY` | activa la verificación anti-bot en writes públicos            |
| `SKIP_SEED=1`          | evita que el seed sobreescriba datos si ya tenés un dump real |


---

## Parar y limpiar

```bash
docker compose down          # para, conserva datos del volumen postgres
docker compose down -v       # para + borra datos (volvés a datos demo limpios)
```

---

## Flujo de trabajo diario

```bash
# arrancar
docker compose up -d

# ver logs del backend mientras desarrollás
docker compose logs -f backend

# lint + typecheck del frontend
cd frontend && npm run lint && npm run typecheck

# lint + typecheck del backend
cd backend && npm run lint && npm run typecheck

# después de cambiar infra/db/schema.ts
cd backend && npm run db:generate
# commitear el .sql + journal que se generaron en infra/db/migrations/
```

---

## Gotchas comunes

**El panel admin no carga / redirige a login en bucle**
: Revisá que el backend esté up (`docker compose ps`). El BFF del admin llama
  al backend por la red interna de Docker; si el backend no está listo, falla.

**El fetch SSR del frontend falla con ECONNREFUSED**
: El frontend dentro de Docker usa `INTERNAL_API_URL=http://backend:8080`, no
  `localhost`. Si corrés el frontend a mano fuera de Docker, ajustá esa variable
  para que apunte a donde esté el backend.

`**NEXT_PUBLIC_`* no actualiza aunque cambie el .env**
: Estas variables se inlinean en el build de Next. Si las cambiás, tenés que
  rebuildar: `docker compose up --build frontend`.

**Windows: el hot reload no funciona (guardo y no pasa nada)**
: Al guardar, la terminal de `docker compose` no muestra ningún `compiling`. Casi
  siempre es porque el repo está en `C:\Users\...`: Docker Desktop no propaga los
  cambios de archivo desde `C:\` al contenedor, y el polling no lo rescata. Mové
  el repo dentro del filesystem de WSL2 (ver "Windows" en Prerrequisitos). El
  stack dev ya corre con `next dev --webpack` justo para maximizar la fiabilidad
  del watcher en este entorno.

**Las migraciones no corren / "migración ya aplicada"**
: Es normal; el job `migrate` es idempotente. Si hay error real, revisá los
  logs de `migrate-seed` con `docker compose logs migrate-seed`.

**No veo datos en el mapa**
: El seed inserta reportes demo. Si no aparecen, verificá que `migrate-seed`
  haya terminado correctamente y que `SKIP_SEED` no esté en `1`.

---

## Próximos pasos

- Leé `[CONTRIBUTING.md](../../CONTRIBUTING.md)` antes de abrir un PR.
- Mirá `[docs/architecture/architecture.md](../architecture/architecture.md)`
para entender el sistema completo.
- Si vas a tocar el esquema de BD, leé
`[docs/deploy/migraciones-de-base-de-datos.md](../deploy/migraciones-de-base-de-datos.md)`.
- Para entender la superficie HTTP del backend, abrí el Swagger local en
[http://localhost:8080/api-docs](http://localhost:8080/api-docs).

