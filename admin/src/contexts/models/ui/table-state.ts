/**
 * Lógica pura de la tabla de modelos: búsqueda, filtros (badge multi, rango,
 * presets), ordenamiento y paginación. Sin React ni DOM, para poder testearla.
 */
import type { ModelRow } from "../application/models-gateway";
import type { ModelColumn, ModelConfig, RangeBucket } from "../model-registry";
import { formatAbsolute, toMillis } from "./cell-format";

export type SortDir = "asc" | "desc";

export interface SortState {
  key: string;
  dir: SortDir;
}

/** Estado de filtros aplicado a la tabla. */
export interface FilterState {
  /** Texto de búsqueda libre. */
  query: string;
  /** Valores seleccionados por columna badge filterable (multi). */
  badges: Record<string, string[]>;
  /** Bucket de rango activo por columna numérica (label del bucket). */
  ranges: Record<string, RangeBucket | null>;
  /** Índices de presets activos. */
  presets: number[];
}

export const EMPTY_FILTERS: FilterState = {
  query: "",
  badges: {},
  ranges: {},
  presets: [],
};

export function renderCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function matchesQuery(row: ModelRow, q: string): boolean {
  if (!q) return true;
  const needle = normalize(q);
  return Object.values(row).some((v) => normalize(renderCell(v)).includes(needle));
}

function matchesBadges(row: ModelRow, badges: FilterState["badges"]): boolean {
  return Object.entries(badges).every(([key, vals]) => {
    if (!vals || vals.length === 0) return true;
    const cell = renderCell(row[key]).toLowerCase();
    return vals.some((v) => v.toLowerCase() === cell);
  });
}

function inBucket(n: number, b: RangeBucket): boolean {
  if (n < b.min) return false;
  if (b.max !== undefined && n > b.max) return false;
  return true;
}

function matchesRanges(row: ModelRow, ranges: FilterState["ranges"]): boolean {
  return Object.entries(ranges).every(([key, bucket]) => {
    if (!bucket) return true;
    return inBucket(Number(row[key] ?? 0), bucket);
  });
}

function matchesPresets(row: ModelRow, model: ModelConfig, active: number[]): boolean {
  if (active.length === 0) return true;
  const presets = model.presets ?? [];
  return active.every((i) => presets[i]?.apply(row) ?? true);
}

/** Aplica todos los filtros a las filas (sin ordenar ni paginar). */
export function filterRows(
  rows: ModelRow[],
  model: ModelConfig,
  filters: FilterState,
): ModelRow[] {
  return rows.filter(
    (r) =>
      matchesQuery(r, filters.query) &&
      matchesBadges(r, filters.badges) &&
      matchesRanges(r, filters.ranges) &&
      matchesPresets(r, model, filters.presets),
  );
}

/** Ordena las filas según el estado (numérico o alfabético). */
export function sortRows(
  rows: ModelRow[],
  sort: SortState | null,
  columns: ModelColumn[],
): ModelRow[] {
  if (!sort) return rows;
  const col = columns.find((c) => c.key === sort.key);
  if (!col) return rows;
  const factor = sort.dir === "asc" ? 1 : -1;
  const numeric = col.numeric === true;
  return [...rows].sort((a, b) => {
    const av = a[sort.key];
    const bv = b[sort.key];
    if (numeric) {
      return (Number(av ?? 0) - Number(bv ?? 0)) * factor;
    }
    return renderCell(av).localeCompare(renderCell(bv), "es") * factor;
  });
}

/** Recorta una página (1-indexed). */
export function paginate<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/** Valores únicos ordenados de una columna (para pills de filtro). */
export function uniqueValues(rows: ModelRow[], key: string): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    const v = renderCell(row[key]);
    if (v !== "—") seen.add(v);
  }
  return [...seen].sort();
}

/** Calcula el valor de un KPI de resumen sobre las filas filtradas. */
export function summaryValue(
  rows: ModelRow[],
  summary: { kind: "count" | "sum" | "countWhere"; key?: string; where?: (r: ModelRow) => boolean },
): number {
  switch (summary.kind) {
    case "count":
      return rows.length;
    case "sum":
      return rows.reduce((acc, r) => acc + Number(r[summary.key ?? ""] ?? 0), 0);
    case "countWhere":
      return summary.where ? rows.filter(summary.where).length : 0;
  }
}

/** Columnas exportables: excluye el ID interno (no aporta a lectura humana). */
export function exportColumns(columns: ModelColumn[]): ModelColumn[] {
  return columns.filter((c) => c.variant !== "id");
}

/** Formatea el valor de una celda para export (CSV/PDF). Fechas legibles. */
export function formatCellForExport(col: ModelColumn, value: unknown): string {
  if (col.variant === "date") {
    const ms = toMillis(Number(value));
    return ms ? formatAbsolute(ms) : "—";
  }
  return renderCell(value);
}

/** Genera CSV (con header) de las filas según las columnas dadas. */
export function rowsToCsv(rows: ModelRow[], columns: ModelColumn[]): string {
  const cols = exportColumns(columns);
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const header = cols.map((c) => escape(c.label)).join(",");
  const lines = rows.map((r) =>
    cols.map((c) => escape(formatCellForExport(c, r[c.key]))).join(","),
  );
  return [header, ...lines].join("\r\n");
}
