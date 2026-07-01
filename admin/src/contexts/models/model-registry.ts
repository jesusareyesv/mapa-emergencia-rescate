/**
 * Registro de los modelos administrables (read-only en F1).
 *
 * Fuente de verdad ÚNICA del dashboard para: el path del backend
 * (/api/public/<path>), la capacidad que lo gatea (<path>:read), la etiqueta de
 * navegación y las columnas a mostrar. Espeja PUBLIC_RESOURCES del backend.
 *
 * Añadir un modelo nuevo = una entrada aquí (YAGNI: sin archivos por modelo
 * mientras la vista sea una tabla read-only genérica; cuando un modelo necesite
 * lógica de dominio propia, se extrae a su bounded-context dedicado).
 */

import type { ModelRow } from "./application/models-gateway";

/** Bucket de filtro por rango numérico (ej. afectados: 1–5). */
export interface RangeBucket {
  label: string;
  /** Mínimo inclusivo. */
  min: number;
  /** Máximo inclusivo; ausente = sin tope. */
  max?: number;
}

export interface ModelColumn {
  /** Clave del campo en el DTO del backend. */
  key: string;
  /** Encabezado visible. */
  label: string;
  /**
   * Cómo renderizar la celda:
   * - "text" (default): texto plano.
   * - "badge": pill de color para valores categóricos.
   * - "id": identificador truncado en monoespaciado atenuado.
   * - "date": epoch (ms o s) como tiempo relativo ("hace 2 h").
   * - "coords": par lat/lng con enlace a mapa.
   * - "longtext": texto largo truncado con tooltip.
   */
  variant?: "text" | "badge" | "id" | "date" | "coords" | "longtext";
  /** Si true, aparecen pills de filtro rápido en la toolbar de la tabla. */
  filterable?: boolean;
  /** Si true, el header permite ordenar por esta columna. */
  sortable?: boolean;
  /** Si true, ordena numéricamente y habilita filtros por rango. */
  numeric?: boolean;
  /** Buckets de filtro por rango (requiere numeric). */
  rangeBuckets?: RangeBucket[];
}

/** KPI de la franja de resumen, calculado sobre las filas filtradas. */
export interface ModelSummary {
  label: string;
  /**
   * - "count": número de filas.
   * - "sum": suma de `key`.
   * - "countWhere": filas que cumplen `where`.
   */
  kind: "count" | "sum" | "countWhere";
  key?: string;
  where?: (row: ModelRow) => boolean;
  /** Color de acento (hex) opcional para el valor. */
  accent?: string;
}

/** Filtro rápido de un clic. */
export interface ModelPreset {
  label: string;
  apply: (row: ModelRow) => boolean;
}

export interface ModelConfig {
  /** Segmento de ruta: /api/public/<path> y /[path] en el dashboard. */
  path: string;
  /** Etiqueta de navegación (es). */
  label: string;
  /** Subtítulo del header de la página (es). */
  subtitle?: string;
  /** Capacidad de lectura que lo gatea. */
  readCapability: string;
  /** Columnas a renderizar (las que existan en el DTO; el resto se ignora). */
  columns: ModelColumn[];
  /** Si true, las filas son clicables y abren un drawer con el detalle. */
  detail?: boolean;
  /** KPIs de la franja de resumen (sobre las filas filtradas). */
  summary?: ModelSummary[];
  /** Filtros rápidos de un clic. */
  presets?: ModelPreset[];
  /** Clave del campo que define el color del borde de severidad. */
  severityKey?: string;
}

// Orden = orden en la navegación.
export const MODELS = [
  {
    path: "reports",
    label: "Reportes",
    subtitle: "Explora, filtra y exporta los reportes de emergencia.",
    readCapability: "report:read",
    detail: true,
    severityKey: "type",
    columns: [
      { key: "id", label: "ID", variant: "id" },
      { key: "type", label: "Tipo", variant: "badge", filterable: true },
      { key: "createdAt", label: "Fecha", variant: "date", sortable: true, numeric: true },
      { key: "place", label: "Lugar" },
      {
        key: "affected",
        label: "Afectados",
        sortable: true,
        numeric: true,
        rangeBuckets: [
          { label: "0", min: 0, max: 0 },
          { label: "1–5", min: 1, max: 5 },
          { label: "6–15", min: 6, max: 15 },
          { label: "15+", min: 16 },
        ],
      },
      { key: "confirmations", label: "Confirmaciones", sortable: true, numeric: true },
      { key: "needs", label: "Necesidades", variant: "longtext" },
    ],
    summary: [
      { label: "Reportes", kind: "count" },
      {
        label: "Críticos",
        kind: "countWhere",
        where: (r) => String(r.type ?? "").toLowerCase() === "critical",
        accent: "#c41a1a",
      },
      { label: "Σ afectados", kind: "sum", key: "affected", accent: "#fbbf24" },
      {
        label: "Sin confirmar",
        kind: "countWhere",
        where: (r) => Number(r.confirmations ?? 0) === 0,
        accent: "#0ea5e9",
      },
    ],
    presets: [
      {
        label: "Críticos sin confirmar",
        apply: (r) =>
          String(r.type ?? "").toLowerCase() === "critical" &&
          Number(r.confirmations ?? 0) === 0,
      },
      { label: "Mayor impacto", apply: (r) => Number(r.affected ?? 0) >= 15 },
      {
        label: "Recientes 24h",
        apply: (r) => {
          const t = Number(r.createdAt ?? 0);
          if (!t) return false;
          const ms = t < 1e12 ? t * 1000 : t; // tolera epoch en s o ms
          return Date.now() - ms <= 24 * 60 * 60 * 1000;
        },
      },
    ],
  },
  {
    path: "missing",
    label: "Desaparecidos",
    readCapability: "missing:read",
    columns: [
      { key: "id", label: "ID", variant: "id" },
      { key: "name", label: "Nombre" },
      { key: "place", label: "Lugar" },
      { key: "status", label: "Estado", variant: "badge", filterable: true },
    ],
  },
  {
    path: "hospitals",
    label: "Hospitales",
    readCapability: "hospital:read",
    columns: [
      { key: "id", label: "ID", variant: "id" },
      { key: "name", label: "Nombre" },
      { key: "place", label: "Lugar" },
    ],
  },
  {
    path: "patients",
    label: "Pacientes",
    readCapability: "patient:read",
    columns: [
      { key: "id", label: "ID", variant: "id" },
      { key: "name", label: "Nombre" },
      { key: "hospitalId", label: "Hospital", variant: "id" },
      { key: "status", label: "Estado", variant: "badge", filterable: true },
    ],
  },
  {
    path: "donations",
    label: "Donaciones",
    readCapability: "donation:read",
    columns: [
      { key: "id", label: "ID", variant: "id" },
      { key: "title", label: "Título" },
      { key: "category", label: "Categoría", variant: "badge", filterable: true },
    ],
  },
  {
    path: "chat",
    label: "Chat",
    readCapability: "chat:read",
    columns: [
      { key: "id", label: "ID", variant: "id" },
      { key: "author", label: "Autor" },
      { key: "message", label: "Mensaje" },
    ],
  },
  {
    path: "contact",
    label: "Contacto",
    readCapability: "contact:read",
    columns: [
      { key: "id", label: "ID", variant: "id" },
      { key: "name", label: "Nombre" },
      { key: "subject", label: "Asunto" },
    ],
  },
] as const satisfies readonly ModelConfig[];

export type ModelPath = (typeof MODELS)[number]["path"];

export function getModel(path: string): ModelConfig | undefined {
  return MODELS.find((m) => m.path === path);
}
