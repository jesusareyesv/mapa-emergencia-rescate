# Guía de integración API v1

Esta guía es el handoff práctico para integrar con la API externa v1 de
Venezuela Ayuda. Combina el contrato vivo de las rutas ya implementadas con las
superficies planificadas que todavía están marcadas como pendientes. Está
pensada para dos tipos de integradores:

- **Socios que envían datos**: ONGs, equipos de campo, otras plataformas
  ciudadanas, formularios propios.
- **Consumidores que leen datos públicos**: frontends socios, mapas, tableros,
  herramientas de análisis y búsqueda.

La fuente de verdad de bajo nivel para lo implementado es
[`public/openapi.yaml`](../../public/openapi.yaml). Esta guía explica cómo usar
ese contrato sin leer el código interno y nombra explícitamente las superficies
que siguen pendientes antes de llamar a Hazlohoy un consumidor 100% V1.

---

## Resumen rápido

Base URL v1:

```text
https://terremoto.hazlohoy.org/api/v1
```

Si el dominio público cambia, actualiza el `servers` entry de
[`public/openapi.yaml`](../../public/openapi.yaml) y esta guía en el mismo PR.

| Necesidad | Endpoint | Auth |
|---|---|---|
| Enviar reportes | `POST /api/v1/reports` | `x-api-key` |
| Leer reportes por tipo | `GET /api/v1/reports?type=...` | abierto |
| Leer desaparecidos agrupados | `GET /api/v1/desaparecidos` | abierto |
| Leer un reporte | `GET /api/v1/reports/{id}` | abierto |
| Actualizar un reporte | `PATCH /api/v1/reports/{id}` | `x-api-key` |
| Leer historial público | `GET /api/v1/reports/{id}/history` | abierto |

V1.0 tiene un solo recurso de escritura: `reports`. El campo `type` discrimina la
forma del reporte. La ruta `GET /api/v1/desaparecidos` es una proyección pública
de lectura sobre reportes `missing_person` ya ingresados al hub, para búsqueda y
conteos de personas desaparecidas; no es una segunda fuente de verdad.

Valores válidos de `type`:

| `type` | Uso |
|---|---|
| `missing_person` | Persona desaparecida o buscada por terceros |
| `checkin` | Persona que reporta que está a salvo o necesita ayuda |
| `help_request` | Necesidad concreta de ayuda |
| `help_offer` | Oferta de ayuda, recurso o capacidad disponible |
| `damaged_building` | Edificio o estructura dañada |

No uses tablas de Supabase, endpoints internos, rutas FastAPI externas ni archivos
de `src/lib/*`. La API `/api/v1/*` es la fachada estable.

## Cliente de referencia: hazlohoy

Hazlohoy es el primer cliente de esta misma fachada. En staging se migrará con
un patrón strangler: cada capacidad actual se mueve a un endpoint v1, se deja en
un puente temporal explícito, o permanece en el hub si es una función
administrativa/privada. El mapa operativo está en
[`docs/architecture/hazlohoy-capability-map.md`](../architecture/hazlohoy-capability-map.md).

Esto importa para integradores externos porque evita APIs especiales para la UI
propia. Si Hazlohoy necesita leer o escribir datos públicos, el endpoint debe ser
el mismo que pueda usar un socio: `/api/v1/reports`, `/api/v1/desaparecidos`, o
un endpoint v1.x documentado cuando exista.

---

## Obtener una API key

Las lecturas `GET` son públicas y no necesitan key.

Las escrituras `POST` y `PATCH` requieren una API key de servidor:

```http
x-api-key: <partner-api-key>
```

Las keys no son autoservicio en v1. Para pedir una, escribe a `hola@maw.dev`
con:

- nombre de la organización o equipo;
- qué datos publicarás;
- volumen esperado;
- contacto operativo responsable.

La key es un secreto de servidor. No la pongas en el navegador, apps móviles
públicas, repos, logs, screenshots ni URLs.

---

## Modelo mental

Cada socio manda reportes con un `external_id` estable de su propio sistema. El
hub estampa `source` desde la API key; no confía en un `source` enviado por el
cliente.

Idempotencia:

```text
(source de tu API key, external_id que mandas)
```

Si reenvías el mismo `external_id`, actualizas tu mismo reporte en vez de crear
un duplicado.

Privacidad:

- `contact` se guarda para coordinación privada, pero nunca aparece en lecturas
  públicas.
- Las lecturas salen de vistas `public_*`, no de tablas crudas.
- El historial público solo muestra campos públicos que cambiaron.

---

## Publicar reportes

### Solicitud mínima

```bash
export VA_API_BASE="https://terremoto.hazlohoy.org/api/v1"
export VA_API_KEY="<partner-api-key>"

curl -sS -X POST "$VA_API_BASE/reports" \
  -H "content-type: application/json" \
  -H "x-api-key: $VA_API_KEY" \
  --data '{
    "reports": [
      {
        "type": "help_request",
        "external_id": "equipo-campo-001",
        "category": "medical",
        "description": "Se necesita medico general para jornada breve en refugio. Coordinar antes de llegar.",
        "urgency": "HIGH",
        "city": "Caracas",
        "place_name": "Colegio Don Bosco",
        "latitude": 10.492,
        "longitude": -66.902,
        "contact": "+58XXXXXXXXXX",
        "source_url": "https://example.org/registros/equipo-campo-001"
      }
    ]
  }'
```

Respuesta esperada:

```json
{
  "accepted": 1,
  "rejected": 0,
  "errored": 0,
  "results": [
    {
      "external_id": "equipo-campo-001",
      "status": "upserted",
      "report_id": "00000000-0000-4000-8000-000000000000"
    }
  ]
}
```

Un `200` puede ser éxito parcial. Revisa `results` fila por fila:

| `results[].status` | Qué significa | Qué hacer |
|---|---|---|
| `upserted` | El reporte quedó escrito | Guarda `report_id` |
| `rejected` | Error permanente de validación | Corrige el payload; no reintentes igual |
| `error` | Error transitorio de DB/servicio | Reintenta solo esa fila |

Límites:

- máximo 200 reportes por `POST`;
- payload máximo 512 KB;
- rate limit aproximado: 120 solicitudes por 60 segundos;
- ante `429`, respeta `Retry-After`.

---

## Payloads por tipo

Todos los reportes aceptan estos campos comunes:

| Campo | Requerido | Notas |
|---|---:|---|
| `type` | sí | Uno de los 5 tipos v1 |
| `external_id` | sí | ID estable en tu sistema; máx 200 |
| `source_url` | no | Link a tu registro; máx 500 |
| `city` | no | máx 80 |
| `latitude`, `longitude` | depende | Obligatorio para `help_request`; opcional para otros |
| `contact` | no | Privado; máx 30; nunca sale en lectura pública |

### `missing_person`

```json
{
  "type": "missing_person",
  "external_id": "missing-123",
  "name": "Nombre Apellido",
  "city": "Caracas",
  "place_name": "Ultimo lugar visto",
  "message": "Descripcion o ultima informacion",
  "contact": "+58XXXXXXXXXX",
  "source_url": "https://example.org/missing-123"
}
```

Notas:

- `name` es requerido.
- El hub siempre guarda `status=LOOKING_FOR_SOMEONE` para este tipo.

### `checkin`

```json
{
  "type": "checkin",
  "external_id": "checkin-123",
  "name": "Nombre Apellido",
  "status": "SAFE",
  "city": "Caracas",
  "message": "Estoy bien y con mi familia.",
  "source_url": "https://example.org/checkin-123"
}
```

`status`: `SAFE`, `NEEDS_HELP`, `LOOKING_FOR_SOMEONE`.

### `help_request`

```json
{
  "type": "help_request",
  "external_id": "need-123",
  "category": "water",
  "description": "Se necesitan 50 litros de agua. Coordinar con receptor antes de llevar.",
  "urgency": "HIGH",
  "status": "OPEN",
  "city": "Caracas",
  "place_name": "Refugio temporal",
  "latitude": 10.492,
  "longitude": -66.902,
  "contact": "+58XXXXXXXXXX"
}
```

`category`: `medical`, `food`, `water`, `shelter`, `transportation`,
`electricity`, `rescue`, `tools`.

`urgency`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.

`status`: `OPEN`, `IN_PROGRESS`, `RESOLVED`.

Notas:

- `category`, `description`, `latitude` y `longitude` son requeridos.
- Las coordenadas deben estar dentro de Venezuela.

### `help_offer`

```json
{
  "type": "help_offer",
  "external_id": "offer-123",
  "category": "transportation",
  "description": "Camioneta disponible para trasladar insumos dentro de Caracas.",
  "availability": "Hoy hasta las 6pm",
  "available": true,
  "city": "Caracas",
  "contact": "+58XXXXXXXXXX"
}
```

`category`: `transportation`, `food`, `shelter`, `medical`, `supplies`,
`translation`.

`available=false` marca que la oferta ya no está disponible.

### `damaged_building`

```json
{
  "type": "damaged_building",
  "external_id": "building-123",
  "place_name": "Edificio Aurora",
  "description": "Grietas visibles en columnas. Requiere revision.",
  "severity": "COLLAPSE_RISK",
  "city": "Caracas",
  "latitude": 10.492,
  "longitude": -66.902,
  "photo_url": "https://example.org/fotos/building-123.jpg"
}
```

`severity`: `CRACKS`, `PARTIAL`, `COLLAPSE_RISK`, `COLLAPSED`.

---

## Leer reportes públicos

Los consumidores leen por `type`:

```bash
curl -sS "$VA_API_BASE/reports?type=help_request&limit=100"
curl -sS "$VA_API_BASE/reports?type=help_request&q=refugio&city=Caracas&limit=100"
```

Filtros disponibles:

| Query | Uso |
|---|---|
| `type` | requerido |
| `limit` | default 100, máx 500 |
| `city` | filtro parcial por ciudad |
| `q` | búsqueda en campos públicos de texto del tipo; mínimo 2 caracteres |
| `since` | cursor de página anterior |

Respuesta:

```json
{
  "reports": [
    {
      "id": "00000000-0000-4000-8000-000000000000",
      "category": "medical",
      "description": "Se necesita medico general para jornada breve en refugio.",
      "urgency": "HIGH",
      "city": "Caracas",
      "latitude": 10.492,
      "longitude": -66.902,
      "status": "OPEN",
      "created_at": "2026-06-29T00:00:00.000Z",
      "place_name": "Colegio Don Bosco",
      "items": null,
      "source": "socio-ejemplo.org",
      "source_url": "https://example.org/registros/equipo-campo-001"
    }
  ],
  "next_cursor": null
}
```

Para paginar, envía el `next_cursor` recibido:

```bash
curl -sS "$VA_API_BASE/reports?type=help_request&limit=100&since=2026-06-29T00:00:00.000Z%7C00000000-0000-4000-8000-000000000000"
```

---

## Leer desaparecidos para búsqueda pública

`/desaparecidos` responde a la pregunta:
"¿qué necesita Hazlohoy para mostrar
búsqueda, tarjetas agrupadas y números de personas reportadas como
desaparecidas?"

La respuesta corta: **sale de `reports`**. Los socios escriben personas
desaparecidas con `POST /api/v1/reports` y `type=missing_person`. El hub guarda
esas filas en `checkins` con `status=LOOKING_FOR_SOMEONE`; la lectura pública
sale de `public_checkins` y nunca de una tabla privada ni del API externo crudo de
desaparecidos.

Ejemplo objetivo:

```bash
curl -sS "$VA_API_BASE/desaparecidos?q=juan&city=Caracas&limit=100"
```

Respuesta:

```json
{
  "summary": {
    "total_reports": 30,
    "active_reports": 24,
    "located_reports": 6,
    "page_groups": 26,
    "page_active_groups": 21,
    "page_located_groups": 5,
    "grouping": "name_plus_location_page"
  },
  "desaparecidos": [
    {
      "id": "00000000-0000-4000-8000-000000000000",
      "representative_report_id": "00000000-0000-4000-8000-000000000000",
      "status": "missing",
      "name": "Nombre Apellido",
      "photo_url": null,
      "locations": ["Caracas", "Ultimo lugar visto"],
      "description": "Descripcion publica",
      "last_reported_at": "2026-06-29T00:00:00.000Z",
      "found_at": null,
      "report_count": 1,
      "active_reports": 1,
      "located_reports": 0,
      "sources": [
        {
          "label": "socio-ejemplo.org",
          "url": "https://example.org/missing-123",
          "report_id": "00000000-0000-4000-8000-000000000000"
        }
      ]
    }
  ],
  "next_cursor": null
}
```

Cómo leer los números:

| Campo | Significado |
|---|---|
| `total_reports` | Conteo exacto de reportes `missing_person` que coinciden con los filtros |
| `active_reports` | Conteo exacto de reportes sin `found_at` |
| `located_reports` | Conteo exacto de reportes con `found_at` |
| `page_groups` | Grupos devueltos en esta página, después de agrupar por nombre + ubicación |
| `page_active_groups` | Grupos de esta página sin ningún `found_at` |
| `page_located_groups` | Grupos de esta página con al menos un `found_at` |

Cada grupo usa `status=missing`, `status=located` o `status=mixed`. `mixed`
significa que la página trae al menos un reporte activo y al menos un reporte
localizado dentro del mismo grupo conservador; usa `active_reports` y
`located_reports` para mostrar el estado sin perder matices.

Importante: los conteos globales son **conteos de reportes**, no conteos
canónicos de personas únicas. La agrupación de `desaparecidos[]` es conservadora y
solo para la página actual; evita juntar homónimos con ubicaciones distintas
cuando hay ciudad o coordenadas. La identidad canónica de una persona requiere el
incremento futuro `entity_id` / `entity_event_log` y revisión humana para merges
de baja confianza.

Hazlohoy usa esta ruta para la búsqueda pública de desaparecidos, y debe seguir
usando `GET /api/v1/reports?type=missing_person` cuando necesita la lista cruda
de reportes sin agrupar.

---

## Leer o actualizar un reporte

Leer por `id`:

```bash
curl -sS "$VA_API_BASE/reports/00000000-0000-4000-8000-000000000000"
```

Actualizar por `id`:

```bash
curl -sS -X PATCH "$VA_API_BASE/reports/00000000-0000-4000-8000-000000000000" \
  -H "content-type: application/json" \
  -H "x-api-key: $VA_API_KEY" \
  --data '{
    "type": "help_request",
    "status": "RESOLVED"
  }'
```

Reglas de `PATCH`:

- `id`, `source` y `external_id` son inmutables.
- `type` es opcional, pero si lo mandas debe coincidir con el reporte.
- Solo se aceptan campos mutables del tipo real del reporte.
- A diferencia de `POST`, `PATCH` rechaza enums o coordenadas inválidas con `400`.
- La ruta registra el cambio en el audit log.
- En el código vivo, cualquier socio con permiso de escritura puede editar cualquier
  reporte. Hasta que exista control de ownership por socio, usa `PATCH` solo para
  tus propios reportes o correcciones coordinadas con el equipo.

Leer historial público:

```bash
curl -sS "$VA_API_BASE/reports/00000000-0000-4000-8000-000000000000/history"
```

---

## Cómo modelar operaciones de campo en v1

No existe `/api/v1/relief-sites` en v1.0. Eso es v1.x, cuando el ciclo de
verificación de sitio esté probado.

Para coordinar refugios, hospitales, colegios, parques, centros de acopio o
puntos médicos en v1.0:

| Situación en campo | Cómo publicarlo en v1 |
|---|---|
| Un sitio necesita médicos, agua, comida, transporte, herramientas o rescate | `help_request` |
| Un equipo ofrece doctores, insumos, transporte, refugio o traducción | `help_offer` |
| Un edificio o estructura tiene daño | `damaged_building` |
| Un sitio ya no necesita algo | `PATCH` al `help_request` y marcar `status=RESOLVED`, o publicar una nueva actualización con otro `external_id` si es otro hecho |

Buenas prácticas:

- Usa `place_name` para el nombre del sitio.
- Usa `description` para indicar que la ayuda debe coordinarse antes de llegar.
- Usa `contact` solo para el receptor confiable; no pongas teléfonos en
  `description`.
- Usa `source_url` para apuntar al registro/verificación original.
- Usa un `external_id` estable que incluya tu sistema y el sitio, por ejemplo
  `field-ops:don-bosco:2026-06-29-medical`.

Mensaje operativo recomendado:

```text
No lleves donaciones a ciegas. Verifica el sitio, identifica un receptor
confiable y coordina antes de mover personas o insumos.
```

---

## Qué no está en v1.0

Estos endpoints son aditivos y no deben bloquear la primera integración:

| Endpoint futuro | Estado |
|---|---|
| `GET /api/v1/dedup` | v1.x; requiere proxy autenticado |
| `GET /api/v1/collection-centers` | v1.x; falta ingesta/procedencia de socios |
| `GET /api/v1/relief-sites` | v1.x; falta proyección durable de estado de sitio |
| `GET /api/v1/entities/{id}/timeline` | norte; requiere `entity_event_log` |
| `GET /api/v1/partners` | futuro admin-only |
| webhooks | diferido; los socios hacen polling |

---

## Checklist para lanzar v1

Antes de anunciar v1 a socios externos:

1. Confirmar que [`public/openapi.yaml`](../../public/openapi.yaml) refleja el
   comportamiento vivo de las rutas `reports`.
2. Publicar esta guía desde el README del repo y desde la documentación de API.
3. Emitir al menos una API key real para un socio piloto.
4. Ejecutar un smoke test de `POST /reports` con un `help_request` y un
   `help_offer`.
5. Ejecutar `GET /reports?type=help_request` y verificar que la respuesta no
   incluya `contact`, teléfonos ni campos privados.
6. Reenviar el mismo `external_id` y confirmar que no crea duplicados.
7. Probar `PATCH /reports/{id}` y `GET /reports/{id}/history`.
8. Probar `GET /desaparecidos?q=...`; confirmar que los conteos son de reportes
   y los grupos son solo de página.
9. Documentar cualquier gap aceptado para el piloto, especialmente lectura
   abierta, rate limits y ownership de `PATCH`.

Comandos locales útiles para validar el PR antes de publicar docs:

```bash
npm test
```

---

## Soporte para integradores

Para dudas de integración o para pedir una API key, escribe a `hola@maw.dev`.
Incluye el nombre del equipo, el tipo de datos, volumen esperado y un contacto
operativo.
