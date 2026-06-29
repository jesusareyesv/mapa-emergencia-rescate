import Link from "next/link";
import {
  Callout,
  C,
  CodeBlock,
  DocHero,
  DocLayout,
  Section,
  TableWrap,
  TD,
  TH,
} from "./doc-ui";

const LAST_UPDATED = "29 de junio de 2026";
const API_BASE = "https://terremoto.hazlohoy.org/api/v1";

const TOC = [
  { id: "api-resumen", label: "Resumen rápido" },
  { id: "api-hazlohoy", label: "Cliente de referencia" },
  { id: "api-key", label: "Obtener una API key" },
  { id: "api-modelo", label: "Modelo mental" },
  { id: "api-publicar", label: "Publicar reportes" },
  { id: "api-payloads", label: "Payloads por tipo" },
  { id: "api-leer", label: "Leer reportes públicos" },
  { id: "api-desaparecidos", label: "Leer desaparecidos" },
  { id: "api-patch", label: "Leer o actualizar" },
  { id: "api-campo", label: "Operaciones de campo" },
  { id: "api-futuro", label: "Qué no está en v1.0" },
  { id: "api-checklist", label: "Checklist para lanzar v1" },
  { id: "api-soporte", label: "Soporte" },
] as const;

const SNIPPET_POST = `export VA_API_BASE="https://terremoto.hazlohoy.org/api/v1"
export VA_API_KEY="<partner-api-key>"

curl -sS -X POST "$VA_API_BASE/reports" \\
  -H "content-type: application/json" \\
  -H "x-api-key: $VA_API_KEY" \\
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
  }'`;

const SNIPPET_POST_RESP = `{
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
}`;

const SNIPPET_MISSING = `{
  "type": "missing_person",
  "external_id": "missing-123",
  "name": "Nombre Apellido",
  "city": "Caracas",
  "place_name": "Ultimo lugar visto",
  "message": "Descripcion o ultima informacion",
  "contact": "+58XXXXXXXXXX",
  "source_url": "https://example.org/missing-123"
}`;

const SNIPPET_CHECKIN = `{
  "type": "checkin",
  "external_id": "checkin-123",
  "name": "Nombre Apellido",
  "status": "SAFE",
  "city": "Caracas",
  "message": "Estoy bien y con mi familia.",
  "source_url": "https://example.org/checkin-123"
}`;

const SNIPPET_HELP_REQ = `{
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
}`;

const SNIPPET_HELP_OFFER = `{
  "type": "help_offer",
  "external_id": "offer-123",
  "category": "transportation",
  "description": "Camioneta disponible para trasladar insumos dentro de Caracas.",
  "availability": "Hoy hasta las 6pm",
  "available": true,
  "city": "Caracas",
  "contact": "+58XXXXXXXXXX"
}`;

const SNIPPET_BUILDING = `{
  "type": "damaged_building",
  "external_id": "building-123",
  "place_name": "Edificio Aurora",
  "description": "Grietas visibles en columnas. Requiere revision.",
  "severity": "COLLAPSE_RISK",
  "city": "Caracas",
  "latitude": 10.492,
  "longitude": -66.902,
  "photo_url": "https://example.org/fotos/building-123.jpg"
}`;

const SNIPPET_GET = `curl -sS "$VA_API_BASE/reports?type=help_request&limit=100"
curl -sS "$VA_API_BASE/reports?type=help_request&q=refugio&city=Caracas&limit=100"`;

const SNIPPET_GET_RESP = `{
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
}`;

const SNIPPET_PAGINATE = `curl -sS "$VA_API_BASE/reports?type=help_request&limit=100&since=2026-06-29T00:00:00.000Z%7C00000000-0000-4000-8000-000000000000"`;

const SNIPPET_DESAP = `curl -sS "$VA_API_BASE/desaparecidos?q=juan&city=Caracas&limit=100"`;

const SNIPPET_DESAP_RESP = `{
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
}`;

const SNIPPET_GET_ONE = `curl -sS "$VA_API_BASE/reports/00000000-0000-4000-8000-000000000000"`;

const SNIPPET_PATCH = `curl -sS -X PATCH "$VA_API_BASE/reports/00000000-0000-4000-8000-000000000000" \\
  -H "content-type: application/json" \\
  -H "x-api-key: $VA_API_KEY" \\
  --data '{
    "type": "help_request",
    "status": "RESOLVED"
  }'`;

const SNIPPET_HISTORY = `curl -sS "$VA_API_BASE/reports/00000000-0000-4000-8000-000000000000/history"`;

const SNIPPET_FIELD_MSG = `No lleves donaciones a ciegas. Verifica el sitio, identifica un receptor
confiable y coordina antes de mover personas o insumos.`;

const HERO = (
  <DocHero pill="API v1 · contrato estable" title="Guía de integración · API v1">
    <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
      Handoff práctico para integrar con la API externa v1 de Venezuela Ayuda.
      Combina el contrato vivo de las rutas ya implementadas con las superficies
      aún pendientes. Pensada para dos públicos: socios que{" "}
      <strong>envían</strong> datos y consumidores que <strong>leen</strong>{" "}
      datos públicos.
    </p>
    <div className="mt-8 max-w-2xl">
      <p className="text-xs uppercase tracking-wide text-white/55">Base URL</p>
      <code className="mt-1 block break-all rounded-lg bg-white/10 px-3 py-2 font-mono text-sm text-white ring-1 ring-white/15">
        {API_BASE}
      </code>
    </div>
    <p className="mt-3 text-xs text-white/50">
      Última actualización: {LAST_UPDATED}. La fuente de verdad de bajo nivel es
      el contrato OpenAPI del repositorio.
    </p>
  </DocHero>
);

export default function ApiDoc() {
  return (
    <DocLayout hero={HERO} toc={TOC}>
      <Callout variant="info" title="Antes de empezar">
        <p>
          V1.0 tiene un solo recurso de escritura: <C>reports</C>. El campo{" "}
          <C>type</C> discrimina la forma del reporte. No uses tablas de
          Supabase, endpoints internos, rutas FastAPI externas ni archivos de{" "}
          <C>src/lib/*</C>: la API <C>/api/v1/*</C> es la fachada estable.
        </p>
      </Callout>

      {/* 1. Resumen rápido */}
      <Section id="api-resumen" eyebrow="01 · Referencia" title="Resumen rápido">
        <TableWrap>
          <thead>
            <tr>
              <th className={TH}>Necesidad</th>
              <th className={TH}>Endpoint</th>
              <th className={TH}>Auth</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}>Enviar reportes</td>
              <td className={TD}><C>POST /api/v1/reports</C></td>
              <td className={TD}><C>x-api-key</C></td>
            </tr>
            <tr>
              <td className={TD}>Leer reportes por tipo</td>
              <td className={TD}><C>{"GET /api/v1/reports?type=..."}</C></td>
              <td className={TD}>abierto</td>
            </tr>
            <tr>
              <td className={TD}>Leer desaparecidos agrupados</td>
              <td className={TD}><C>GET /api/v1/desaparecidos</C></td>
              <td className={TD}>abierto</td>
            </tr>
            <tr>
              <td className={TD}>Leer un reporte</td>
              <td className={TD}><C>{"GET /api/v1/reports/{id}"}</C></td>
              <td className={TD}>abierto</td>
            </tr>
            <tr>
              <td className={TD}>Actualizar un reporte</td>
              <td className={TD}><C>{"PATCH /api/v1/reports/{id}"}</C></td>
              <td className={TD}><C>x-api-key</C></td>
            </tr>
            <tr>
              <td className={TD}>Leer historial público</td>
              <td className={TD}><C>{"GET /api/v1/reports/{id}/history"}</C></td>
              <td className={TD}>abierto</td>
            </tr>
          </tbody>
        </TableWrap>

        <p>
          <C>GET /api/v1/desaparecidos</C> es una proyección pública de lectura
          sobre reportes <C>missing_person</C> ya ingresados al hub, para
          búsqueda y conteos; no es una segunda fuente de verdad.
        </p>

        <h3 className="qi-h4 pt-2 text-[var(--etext)]">
          Valores válidos de <C>type</C>
        </h3>
        <TableWrap>
          <thead>
            <tr>
              <th className={TH}>type</th>
              <th className={TH}>Uso</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}><C>missing_person</C></td>
              <td className={TD}>Persona desaparecida o buscada por terceros</td>
            </tr>
            <tr>
              <td className={TD}><C>checkin</C></td>
              <td className={TD}>Persona que reporta que está a salvo o necesita ayuda</td>
            </tr>
            <tr>
              <td className={TD}><C>help_request</C></td>
              <td className={TD}>Necesidad concreta de ayuda</td>
            </tr>
            <tr>
              <td className={TD}><C>help_offer</C></td>
              <td className={TD}>Oferta de ayuda, recurso o capacidad disponible</td>
            </tr>
            <tr>
              <td className={TD}><C>damaged_building</C></td>
              <td className={TD}>Edificio o estructura dañada</td>
            </tr>
          </tbody>
        </TableWrap>
      </Section>

      {/* 2. Cliente de referencia */}
      <Section
        id="api-hazlohoy"
        eyebrow="02 · Contexto"
        title="Cliente de referencia: hazlohoy"
      >
        <p>
          Hazlohoy es el primer cliente de esta misma fachada. En staging se
          migra con un patrón <em>strangler</em>: cada capacidad se mueve a un
          endpoint v1, se deja en un puente temporal explícito, o permanece en el
          hub si es una función administrativa/privada.
        </p>
        <p>
          Esto importa para integradores externos porque evita APIs especiales
          para la UI propia. Si Hazlohoy necesita leer o escribir datos públicos,
          el endpoint debe ser el mismo que pueda usar un socio:{" "}
          <C>/api/v1/reports</C>, <C>/api/v1/desaparecidos</C>, o un endpoint
          v1.x documentado cuando exista.
        </p>
      </Section>

      {/* 3. API key */}
      <Section id="api-key" eyebrow="03 · Autenticación" title="Obtener una API key">
        <p>
          Las lecturas <C>GET</C> son públicas y no necesitan key. Las escrituras{" "}
          <C>POST</C> y <C>PATCH</C> requieren una API key de servidor:
        </p>
        <CodeBlock lang="http" code={"x-api-key: <partner-api-key>"} />
        <p>
          Las keys no son autoservicio en v1. Para pedir una, escribe a{" "}
          <C>hola@maw.dev</C> con: nombre de la organización o equipo, qué datos
          publicarás, volumen esperado y contacto operativo responsable.
        </p>
        <Callout variant="warn" title="Secreto de servidor">
          <p>
            La key es un secreto de servidor. No la pongas en el navegador, apps
            móviles públicas, repos, logs, screenshots ni URLs.
          </p>
        </Callout>
      </Section>

      {/* 4. Modelo mental */}
      <Section id="api-modelo" eyebrow="04 · Conceptos" title="Modelo mental">
        <p>
          Cada socio manda reportes con un <C>external_id</C> estable de su
          propio sistema. El hub estampa <C>source</C> desde la API key; no
          confía en un <C>source</C> enviado por el cliente.
        </p>
        <p className="font-semibold text-[var(--etext)]">Idempotencia</p>
        <CodeBlock code={"(source de tu API key, external_id que mandas)"} />
        <p>
          Si reenvías el mismo <C>external_id</C>, actualizas tu mismo reporte en
          vez de crear un duplicado.
        </p>
        <Callout variant="warn" title="Privacidad">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <C>contact</C> se guarda para coordinación privada, pero nunca
              aparece en lecturas públicas.
            </li>
            <li>Las lecturas salen de vistas <C>public_*</C>, no de tablas crudas.</li>
            <li>El historial público solo muestra campos públicos que cambiaron.</li>
          </ul>
        </Callout>
      </Section>

      {/* 5. Publicar reportes */}
      <Section id="api-publicar" eyebrow="05 · Escritura" title="Publicar reportes">
        <h3 className="qi-h4 text-[var(--etext)]">Solicitud mínima</h3>
        <CodeBlock lang="bash" code={SNIPPET_POST} />
        <h3 className="qi-h4 pt-2 text-[var(--etext)]">Respuesta esperada</h3>
        <CodeBlock lang="json" code={SNIPPET_POST_RESP} />
        <p>
          Un <C>200</C> puede ser éxito parcial. Revisa <C>results</C> fila por
          fila:
        </p>
        <TableWrap>
          <thead>
            <tr>
              <th className={TH}>status</th>
              <th className={TH}>Qué significa</th>
              <th className={TH}>Qué hacer</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}><C>upserted</C></td>
              <td className={TD}>El reporte quedó escrito</td>
              <td className={TD}>Guarda <C>report_id</C></td>
            </tr>
            <tr>
              <td className={TD}><C>rejected</C></td>
              <td className={TD}>Error permanente de validación</td>
              <td className={TD}>Corrige el payload; no reintentes igual</td>
            </tr>
            <tr>
              <td className={TD}><C>error</C></td>
              <td className={TD}>Error transitorio de DB/servicio</td>
              <td className={TD}>Reintenta solo esa fila</td>
            </tr>
          </tbody>
        </TableWrap>
        <Callout variant="warn" title="Límites">
          <ul className="list-disc space-y-1 pl-5">
            <li>máximo 200 reportes por <C>POST</C>;</li>
            <li>payload máximo 512 KB;</li>
            <li>rate limit aproximado: 120 solicitudes por 60 segundos;</li>
            <li>ante <C>429</C>, respeta <C>Retry-After</C>.</li>
          </ul>
        </Callout>
      </Section>

      {/* 6. Payloads por tipo */}
      <Section id="api-payloads" eyebrow="06 · Esquemas" title="Payloads por tipo">
        <p>Todos los reportes aceptan estos campos comunes:</p>
        <TableWrap>
          <thead>
            <tr>
              <th className={TH}>Campo</th>
              <th className={TH}>Requerido</th>
              <th className={TH}>Notas</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}><C>type</C></td>
              <td className={TD}>sí</td>
              <td className={TD}>Uno de los 5 tipos v1</td>
            </tr>
            <tr>
              <td className={TD}><C>external_id</C></td>
              <td className={TD}>sí</td>
              <td className={TD}>ID estable en tu sistema; máx 200</td>
            </tr>
            <tr>
              <td className={TD}><C>source_url</C></td>
              <td className={TD}>no</td>
              <td className={TD}>Link a tu registro; máx 500</td>
            </tr>
            <tr>
              <td className={TD}><C>city</C></td>
              <td className={TD}>no</td>
              <td className={TD}>máx 80</td>
            </tr>
            <tr>
              <td className={TD}><C>latitude</C>, <C>longitude</C></td>
              <td className={TD}>depende</td>
              <td className={TD}>Obligatorio para <C>help_request</C>; opcional para otros</td>
            </tr>
            <tr>
              <td className={TD}><C>contact</C></td>
              <td className={TD}>no</td>
              <td className={TD}>Privado; máx 30; nunca sale en lectura pública</td>
            </tr>
          </tbody>
        </TableWrap>

        <h3 className="qi-h4 pt-2 text-[var(--etext)]"><C>missing_person</C></h3>
        <CodeBlock lang="json" code={SNIPPET_MISSING} />
        <ul className="list-disc space-y-1 pl-5">
          <li><C>name</C> es requerido.</li>
          <li>El hub siempre guarda <C>status=LOOKING_FOR_SOMEONE</C> para este tipo.</li>
        </ul>

        <h3 className="qi-h4 pt-2 text-[var(--etext)]"><C>checkin</C></h3>
        <CodeBlock lang="json" code={SNIPPET_CHECKIN} />
        <p><C>status</C>: <C>SAFE</C>, <C>NEEDS_HELP</C>, <C>LOOKING_FOR_SOMEONE</C>.</p>

        <h3 className="qi-h4 pt-2 text-[var(--etext)]"><C>help_request</C></h3>
        <CodeBlock lang="json" code={SNIPPET_HELP_REQ} />
        <p>
          <C>category</C>: <C>medical</C>, <C>food</C>, <C>water</C>,{" "}
          <C>shelter</C>, <C>transportation</C>, <C>electricity</C>,{" "}
          <C>rescue</C>, <C>tools</C>.
        </p>
        <p><C>urgency</C>: <C>LOW</C>, <C>MEDIUM</C>, <C>HIGH</C>, <C>CRITICAL</C>.</p>
        <p><C>status</C>: <C>OPEN</C>, <C>IN_PROGRESS</C>, <C>RESOLVED</C>.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li><C>category</C>, <C>description</C>, <C>latitude</C> y <C>longitude</C> son requeridos.</li>
          <li>Las coordenadas deben estar dentro de Venezuela.</li>
        </ul>

        <h3 className="qi-h4 pt-2 text-[var(--etext)]"><C>help_offer</C></h3>
        <CodeBlock lang="json" code={SNIPPET_HELP_OFFER} />
        <p>
          <C>category</C>: <C>transportation</C>, <C>food</C>, <C>shelter</C>,{" "}
          <C>medical</C>, <C>supplies</C>, <C>translation</C>.
        </p>
        <p><C>available=false</C> marca que la oferta ya no está disponible.</p>

        <h3 className="qi-h4 pt-2 text-[var(--etext)]"><C>damaged_building</C></h3>
        <CodeBlock lang="json" code={SNIPPET_BUILDING} />
        <p><C>severity</C>: <C>CRACKS</C>, <C>PARTIAL</C>, <C>COLLAPSE_RISK</C>, <C>COLLAPSED</C>.</p>
      </Section>

      {/* 7. Leer reportes públicos */}
      <Section id="api-leer" eyebrow="07 · Lectura" title="Leer reportes públicos">
        <p>Los consumidores leen por <C>type</C>:</p>
        <CodeBlock lang="bash" code={SNIPPET_GET} />
        <h3 className="qi-h4 pt-2 text-[var(--etext)]">Filtros disponibles</h3>
        <TableWrap>
          <thead>
            <tr>
              <th className={TH}>Query</th>
              <th className={TH}>Uso</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}><C>type</C></td>
              <td className={TD}>requerido</td>
            </tr>
            <tr>
              <td className={TD}><C>limit</C></td>
              <td className={TD}>default 100, máx 500</td>
            </tr>
            <tr>
              <td className={TD}><C>city</C></td>
              <td className={TD}>filtro parcial por ciudad</td>
            </tr>
            <tr>
              <td className={TD}><C>q</C></td>
              <td className={TD}>búsqueda en campos públicos de texto del tipo; mínimo 2 caracteres</td>
            </tr>
            <tr>
              <td className={TD}><C>since</C></td>
              <td className={TD}>cursor de página anterior</td>
            </tr>
          </tbody>
        </TableWrap>
        <h3 className="qi-h4 pt-2 text-[var(--etext)]">Respuesta</h3>
        <CodeBlock lang="json" code={SNIPPET_GET_RESP} />
        <p>Para paginar, envía el <C>next_cursor</C> recibido:</p>
        <CodeBlock lang="bash" code={SNIPPET_PAGINATE} />
      </Section>

      {/* 8. Desaparecidos */}
      <Section
        id="api-desaparecidos"
        eyebrow="08 · Lectura"
        title="Leer desaparecidos para búsqueda pública"
      >
        <p>
          La respuesta corta: <strong>sale de <C>reports</C></strong>. Los socios
          escriben personas desaparecidas con <C>POST /api/v1/reports</C> y{" "}
          <C>type=missing_person</C>. El hub guarda esas filas en <C>checkins</C>{" "}
          con <C>status=LOOKING_FOR_SOMEONE</C>; la lectura pública sale de{" "}
          <C>public_checkins</C> y nunca de una tabla privada ni del API externo
          crudo de desaparecidos.
        </p>
        <h3 className="qi-h4 pt-2 text-[var(--etext)]">Ejemplo objetivo</h3>
        <CodeBlock lang="bash" code={SNIPPET_DESAP} />
        <h3 className="qi-h4 pt-2 text-[var(--etext)]">Respuesta</h3>
        <CodeBlock lang="json" code={SNIPPET_DESAP_RESP} />
        <h3 className="qi-h4 pt-2 text-[var(--etext)]">Cómo leer los números</h3>
        <TableWrap>
          <thead>
            <tr>
              <th className={TH}>Campo</th>
              <th className={TH}>Significado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}><C>total_reports</C></td>
              <td className={TD}>Conteo exacto de reportes <C>missing_person</C> que coinciden con los filtros</td>
            </tr>
            <tr>
              <td className={TD}><C>active_reports</C></td>
              <td className={TD}>Conteo exacto de reportes sin <C>found_at</C></td>
            </tr>
            <tr>
              <td className={TD}><C>located_reports</C></td>
              <td className={TD}>Conteo exacto de reportes con <C>found_at</C></td>
            </tr>
            <tr>
              <td className={TD}><C>page_groups</C></td>
              <td className={TD}>Grupos devueltos en esta página, tras agrupar por nombre + ubicación</td>
            </tr>
            <tr>
              <td className={TD}><C>page_active_groups</C></td>
              <td className={TD}>Grupos de esta página sin ningún <C>found_at</C></td>
            </tr>
            <tr>
              <td className={TD}><C>page_located_groups</C></td>
              <td className={TD}>Grupos de esta página con al menos un <C>found_at</C></td>
            </tr>
          </tbody>
        </TableWrap>
        <p>
          Cada grupo usa <C>status=missing</C>, <C>status=located</C> o{" "}
          <C>status=mixed</C>. <C>mixed</C> significa que la página trae al menos
          un reporte activo y al menos uno localizado dentro del mismo grupo
          conservador; usa <C>active_reports</C> y <C>located_reports</C> para
          mostrar el estado sin perder matices.
        </p>
        <Callout variant="warn" title="Conteos vs. identidad canónica">
          <p>
            Los conteos globales son <strong>conteos de reportes</strong>, no
            conteos canónicos de personas únicas. La agrupación de{" "}
            <C>desaparecidos[]</C> es conservadora y solo para la página actual;
            evita juntar homónimos con ubicaciones distintas cuando hay ciudad o
            coordenadas. La identidad canónica requiere el incremento futuro{" "}
            <C>entity_id</C> / <C>entity_event_log</C> y revisión humana para
            merges de baja confianza.
          </p>
        </Callout>
        <p>
          Hazlohoy usa esta ruta para la búsqueda pública, y debe seguir usando{" "}
          <C>{"GET /api/v1/reports?type=missing_person"}</C> cuando necesita la
          lista cruda de reportes sin agrupar.
        </p>
      </Section>

      {/* 9. Leer o actualizar */}
      <Section
        id="api-patch"
        eyebrow="09 · Edición"
        title="Leer o actualizar un reporte"
      >
        <h3 className="qi-h4 text-[var(--etext)]">Leer por <C>id</C></h3>
        <CodeBlock lang="bash" code={SNIPPET_GET_ONE} />
        <h3 className="qi-h4 pt-2 text-[var(--etext)]">Actualizar por <C>id</C></h3>
        <CodeBlock lang="bash" code={SNIPPET_PATCH} />
        <h3 className="qi-h4 pt-2 text-[var(--etext)]">Reglas de <C>PATCH</C></h3>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><C>id</C>, <C>source</C> y <C>external_id</C> son inmutables.</li>
          <li><C>type</C> es opcional, pero si lo mandas debe coincidir con el reporte.</li>
          <li>Solo se aceptan campos mutables del tipo real del reporte.</li>
          <li>A diferencia de <C>POST</C>, <C>PATCH</C> rechaza enums o coordenadas inválidas con <C>400</C>.</li>
          <li>La ruta registra el cambio en el audit log.</li>
          <li>
            En el código vivo, cualquier socio con permiso de escritura puede
            editar cualquier reporte. Hasta que exista control de ownership por
            socio, usa <C>PATCH</C> solo para tus propios reportes o correcciones
            coordinadas con el equipo.
          </li>
        </ul>
        <h3 className="qi-h4 pt-2 text-[var(--etext)]">Leer historial público</h3>
        <CodeBlock lang="bash" code={SNIPPET_HISTORY} />
      </Section>

      {/* 10. Operaciones de campo */}
      <Section
        id="api-campo"
        eyebrow="10 · Operación"
        title="Cómo modelar operaciones de campo en v1"
      >
        <p>
          No existe <C>/api/v1/relief-sites</C> en v1.0. Eso es v1.x, cuando el
          ciclo de verificación de sitio esté probado. Para coordinar refugios,
          hospitales, colegios, parques, centros de acopio o puntos médicos en
          v1.0:
        </p>
        <TableWrap>
          <thead>
            <tr>
              <th className={TH}>Situación en campo</th>
              <th className={TH}>Cómo publicarlo en v1</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}>Un sitio necesita médicos, agua, comida, transporte, herramientas o rescate</td>
              <td className={TD}><C>help_request</C></td>
            </tr>
            <tr>
              <td className={TD}>Un equipo ofrece doctores, insumos, transporte, refugio o traducción</td>
              <td className={TD}><C>help_offer</C></td>
            </tr>
            <tr>
              <td className={TD}>Un edificio o estructura tiene daño</td>
              <td className={TD}><C>damaged_building</C></td>
            </tr>
            <tr>
              <td className={TD}>Un sitio ya no necesita algo</td>
              <td className={TD}><C>PATCH</C> al <C>help_request</C> con <C>status=RESOLVED</C>, o una nueva actualización con otro <C>external_id</C> si es otro hecho</td>
            </tr>
          </tbody>
        </TableWrap>
        <Callout variant="ok">
          <ul className="list-disc space-y-1 pl-5">
            <li>Usa <C>place_name</C> para el nombre del sitio.</li>
            <li>Usa <C>description</C> para indicar que la ayuda debe coordinarse antes de llegar.</li>
            <li>Usa <C>contact</C> solo para el receptor confiable; no pongas teléfonos en <C>description</C>.</li>
            <li>Usa <C>source_url</C> para apuntar al registro/verificación original.</li>
            <li>Usa un <C>external_id</C> estable que incluya tu sistema y el sitio, p. ej. <C>field-ops:don-bosco:2026-06-29-medical</C>.</li>
          </ul>
        </Callout>
        <h3 className="qi-h4 pt-2 text-[var(--etext)]">Mensaje operativo recomendado</h3>
        <CodeBlock code={SNIPPET_FIELD_MSG} />
      </Section>

      {/* 11. Qué no está en v1.0 */}
      <Section id="api-futuro" eyebrow="11 · Roadmap" title="Qué no está en v1.0">
        <p>
          Estos endpoints son aditivos y no deben bloquear la primera
          integración:
        </p>
        <TableWrap>
          <thead>
            <tr>
              <th className={TH}>Endpoint futuro</th>
              <th className={TH}>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={TD}><C>GET /api/v1/dedup</C></td>
              <td className={TD}>v1.x; requiere proxy autenticado</td>
            </tr>
            <tr>
              <td className={TD}><C>GET /api/v1/collection-centers</C></td>
              <td className={TD}>v1.x; falta ingesta/procedencia de socios</td>
            </tr>
            <tr>
              <td className={TD}><C>GET /api/v1/relief-sites</C></td>
              <td className={TD}>v1.x; falta proyección durable de estado de sitio</td>
            </tr>
            <tr>
              <td className={TD}><C>{"GET /api/v1/entities/{id}/timeline"}</C></td>
              <td className={TD}>norte; requiere <C>entity_event_log</C></td>
            </tr>
            <tr>
              <td className={TD}><C>GET /api/v1/partners</C></td>
              <td className={TD}>futuro admin-only</td>
            </tr>
            <tr>
              <td className={TD}>webhooks</td>
              <td className={TD}>diferido; los socios hacen polling</td>
            </tr>
          </tbody>
        </TableWrap>
      </Section>

      {/* 12. Checklist */}
      <Section
        id="api-checklist"
        eyebrow="12 · Lanzamiento"
        title="Checklist para lanzar v1"
      >
        <p>Antes de anunciar v1 a socios externos:</p>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>Confirmar que el contrato OpenAPI refleja el comportamiento vivo de las rutas <C>reports</C>.</li>
          <li>Publicar esta guía desde el README del repo y desde la documentación de API.</li>
          <li>Emitir al menos una API key real para un socio piloto.</li>
          <li>Ejecutar un smoke test de <C>POST /reports</C> con un <C>help_request</C> y un <C>help_offer</C>.</li>
          <li>Ejecutar <C>{"GET /reports?type=help_request"}</C> y verificar que la respuesta no incluya <C>contact</C>, teléfonos ni campos privados.</li>
          <li>Reenviar el mismo <C>external_id</C> y confirmar que no crea duplicados.</li>
          <li>Probar <C>{"PATCH /reports/{id}"}</C> y <C>{"GET /reports/{id}/history"}</C>.</li>
          <li>Probar <C>{"GET /desaparecidos?q=..."}</C>; confirmar que los conteos son de reportes y los grupos son solo de página.</li>
          <li>Documentar cualquier gap aceptado para el piloto: lectura abierta, rate limits y ownership de <C>PATCH</C>.</li>
        </ol>
      </Section>

      {/* 13. Soporte */}
      <Section id="api-soporte" eyebrow="13 · Contacto" title="Soporte para integradores">
        <p>
          Para dudas de integración o para pedir una API key, escribe a{" "}
          <C>hola@maw.dev</C>. Incluye el nombre del equipo, el tipo de datos,
          volumen esperado y un contacto operativo.
        </p>
        <p className="text-sm">
          Ver también la{" "}
          <Link
            href="/privacidad"
            className="font-semibold text-sky-700 hover:underline"
          >
            política de privacidad
          </Link>
          .
        </p>
        <p className="mt-8 border-t border-[var(--eborder)] pt-6 text-xs text-[var(--etext3)]">
          La fuente de verdad de bajo nivel es el contrato OpenAPI del
          repositorio. Si el dominio público o el contrato cambian, actualiza el
          artefacto OpenAPI y esta guía en el mismo PR.
        </p>
      </Section>
    </DocLayout>
  );
}
