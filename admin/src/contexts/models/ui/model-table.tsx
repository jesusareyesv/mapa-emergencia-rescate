"use client";

import { useMemo, useState } from "react";
import { useModelList } from "./use-model-list";
import { badgeStyle, categoryColor, formatRelativeTime, formatAbsolute, mapUrl } from "./cell-format";
import {
  EMPTY_FILTERS,
  filterRows,
  sortRows,
  paginate,
  pageCount,
  uniqueValues,
  summaryValue,
  rowsToCsv,
  renderCell,
  type FilterState,
  type SortState,
} from "./table-state";
import { downloadCsv } from "./export-csv";
import { downloadPdf } from "./export-pdf";
import type { PdfMeta } from "./export-pdf";
import { RowDetail } from "./row-detail";
import { Pagination } from "@/src/ui/atoms/pagination";
import type { ModelColumn, ModelConfig, RangeBucket } from "../model-registry";
import type { ModelRow } from "../application/models-gateway";

const PAGE_SIZE = 50;

/** Renderiza el contenido de una celda según la variante de su columna. */
function Cell({ column, value }: { column: ModelColumn; value: unknown }) {
  const text = renderCell(value);

  if (column.variant === "badge" && value !== null && value !== undefined) {
    const { fg, bg } = badgeStyle(text);
    return (
      <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
        style={{ color: fg, backgroundColor: bg }}
      >
        {text}
      </span>
    );
  }

  if (column.variant === "id") {
    return (
      <span className="font-mono text-xs text-etext-soft" title={text}>
        {text.length > 10 ? `${text.slice(0, 8)}…` : text}
      </span>
    );
  }

  if (column.variant === "date") {
    const n = Number(value);
    if (!n) return <span className="text-etext-soft">—</span>;
    return (
      <span className="text-etext-muted" title={formatAbsolute(n)}>
        {formatRelativeTime(n)}
      </span>
    );
  }

  if (column.variant === "longtext") {
    if (value === null || value === undefined || text === "") {
      return <span className="text-etext-soft">—</span>;
    }
    return (
      <span className="block max-w-[16rem] truncate text-etext" title={text}>
        {text}
      </span>
    );
  }

  if (column.variant === "coords") {
    const [lat, lng] = text.split(/[,\s]+/).map(Number);
    if (lat !== undefined && lng !== undefined && Number.isFinite(lat) && Number.isFinite(lng)) {
      return (
        <a
          href={mapUrl(lat, lng)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-mono text-xs text-brand-blue hover:underline"
        >
          {lat.toFixed(3)}, {lng.toFixed(3)} ↗
        </a>
      );
    }
    return <span className="text-etext-soft">—</span>;
  }

  if (column.numeric) {
    return <span className="tabular-nums text-etext">{text}</span>;
  }

  return <span className="text-etext">{text}</span>;
}

/* ── Pills de filtro multi-select por columna badge ──────────────────── */
function BadgeFilter({
  column,
  values,
  active,
  onToggle,
  onClear,
}: {
  column: ModelColumn;
  values: string[];
  active: string[];
  onToggle: (val: string) => void;
  onClear: () => void;
}) {
  if (values.length === 0) return null;
  const allOff = active.length === 0;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="shrink-0 text-[11px] font-medium text-etext-soft">{column.label}:</span>
      <button
        type="button"
        onClick={onClear}
        className={[
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
          allOff
            ? "border-navy bg-navy text-on-dark"
            : "border-border bg-surface text-etext-muted hover:bg-surface-muted hover:text-etext",
        ].join(" ")}
      >
        Todos
      </button>
      {values.map((v) => {
        const isActive = active.includes(v);
        const { fg, bg } = badgeStyle(v);
        return (
          <button
            key={v}
            type="button"
            onClick={() => onToggle(v)}
            className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-all"
            style={
              isActive
                ? { color: fg, backgroundColor: bg, borderColor: "transparent" }
                : { color: "var(--text-muted)", backgroundColor: "transparent", borderColor: "var(--border)" }
            }
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

/* ── Pills de filtro por rango numérico ──────────────────────────────── */
function RangeFilter({
  column,
  active,
  onSelect,
}: {
  column: ModelColumn;
  active: RangeBucket | null;
  onSelect: (b: RangeBucket | null) => void;
}) {
  const buckets = column.rangeBuckets ?? [];
  if (buckets.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="shrink-0 text-[11px] font-medium text-etext-soft">{column.label}:</span>
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={[
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
          !active
            ? "border-navy bg-navy text-on-dark"
            : "border-border bg-surface text-etext-muted hover:bg-surface-muted hover:text-etext",
        ].join(" ")}
      >
        Todos
      </button>
      {buckets.map((b) => {
        const isActive = active?.label === b.label;
        return (
          <button
            key={b.label}
            type="button"
            onClick={() => onSelect(isActive ? null : b)}
            className={[
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
              isActive
                ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
                : "border-border bg-surface text-etext-muted hover:bg-surface-muted hover:text-etext",
            ].join(" ")}
          >
            {b.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Tabla ───────────────────────────────────────────────────────────── */

export function ModelTable({ model }: { model: ModelConfig }) {
  const { data, isLoading, isError, error } = useModelList(model.path);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortState | null>(null);
  const [page, setPage] = useState(1);
  const [detailRow, setDetailRow] = useState<ModelRow | null>(null);

  const allRows = useMemo(() => data ?? [], [data]);

  const badgeColumns = useMemo(
    () => model.columns.filter((c) => c.filterable && c.variant === "badge"),
    [model.columns],
  );
  const rangeColumns = useMemo(
    () => model.columns.filter((c) => c.numeric && (c.rangeBuckets?.length ?? 0) > 0),
    [model.columns],
  );

  const badgeValues = useMemo(() => {
    const result: Record<string, string[]> = {};
    for (const col of badgeColumns) result[col.key] = uniqueValues(allRows, col.key);
    return result;
  }, [allRows, badgeColumns]);

  const filtered = useMemo(
    () => filterRows(allRows, model, filters),
    [allRows, model, filters],
  );
  const sorted = useMemo(() => sortRows(filtered, sort, model.columns), [filtered, sort, model.columns]);

  const totalPages = pageCount(sorted.length, PAGE_SIZE);
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(() => paginate(sorted, safePage, PAGE_SIZE), [sorted, safePage]);

  // Helpers de actualización de filtros (resetean a la página 1).
  const update = (next: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    setPage(1);
  };
  const toggleBadge = (key: string, val: string) => {
    const cur = filters.badges[key] ?? [];
    const next = cur.includes(val) ? cur.filter((v) => v !== val) : [...cur, val];
    update({ badges: { ...filters.badges, [key]: next } });
  };
  const clearBadge = (key: string) => update({ badges: { ...filters.badges, [key]: [] } });
  const setRange = (key: string, b: RangeBucket | null) =>
    update({ ranges: { ...filters.ranges, [key]: b } });
  const togglePreset = (i: number) => {
    const next = filters.presets.includes(i)
      ? filters.presets.filter((p) => p !== i)
      : [...filters.presets, i];
    update({ presets: next });
  };

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "desc" };
      if (prev.dir === "desc") return { key, dir: "asc" };
      return null;
    });
  };

  const stamp = () => new Date().toISOString().slice(0, 10);

  const onExportCsv = () => {
    const csv = rowsToCsv(sorted, model.columns);
    downloadCsv(`${model.path}-${stamp()}.csv`, csv);
  };

  const onExportPdf = () => {
    const activeBadges = Object.entries(filters.badges)
      .filter(([, vals]) => vals.length > 0)
      .map(([k, vals]) => `${k}: ${vals.join(", ")}`)
      .join(" · ");
    const activeRange = Object.entries(filters.ranges)
      .filter(([, b]) => b !== null)
      .map(([k, b]) => `${k}: ${b!.label}`)
      .join(" · ");
    const subtitleParts = [
      filters.query ? `Búsqueda: "${filters.query}"` : "",
      activeBadges,
      activeRange,
    ].filter(Boolean);

    const kpis = model.summary?.map((s) => ({
      label: s.label,
      value: summaryValue(filtered, s).toLocaleString("es"),
    }));

    const meta: PdfMeta = {
      title: model.label,
      subtitle: subtitleParts.length > 0 ? subtitleParts.join("  ·  ") : undefined,
      kpis,
    };

    void downloadPdf(`${model.path}-${stamp()}.pdf`, meta, sorted, model.columns);
  };

  if (isLoading) return <TableSkeleton model={model} />;
  if (isError) {
    return (
      <p role="alert" className="mt-4 text-sm text-crisis">
        Error al cargar {model.label}: {error instanceof Error ? error.message : "desconocido"}
      </p>
    );
  }

  const resultLabel =
    sorted.length === allRows.length
      ? `${sorted.length.toLocaleString("es")} resultado${sorted.length !== 1 ? "s" : ""}`
      : `Mostrando ${sorted.length.toLocaleString("es")} de ${allRows.length.toLocaleString("es")}`;

  return (
    <div className="flex flex-col gap-6">
      {/* Header centrado */}
      <div className="flex flex-col items-center text-center">
        <h1 className="text-2xl font-bold tracking-tight text-etext">{model.label}</h1>
        {model.subtitle && (
          <p className="mt-1 max-w-xl text-sm text-etext-muted">{model.subtitle}</p>
        )}
      </div>

      {/* Summary KPIs */}
      {model.summary && model.summary.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {model.summary.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-etext-soft">
                {s.label}
              </p>
              <p
                className="mt-1 font-mono text-2xl font-bold tabular-nums text-etext"
                style={s.accent ? { color: s.accent } : undefined}
              >
                {summaryValue(filtered, s).toLocaleString("es")}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Barra de filtros consolidada */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        {/* Fila 1: buscador · contador · export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-[280px] shrink-0">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-etext-soft">
              <SearchIcon />
            </span>
            <input
              type="search"
              placeholder={`Buscar en ${model.label}…`}
              value={filters.query}
              onChange={(e) => update({ query: e.target.value })}
              className="w-full rounded-full border border-border bg-surface-muted/40 py-2 pl-9 pr-3 text-sm text-etext placeholder:text-etext-soft focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy transition-colors"
            />
          </div>

          <span className="text-xs font-medium text-etext-soft whitespace-nowrap">
            {resultLabel}
          </span>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={onExportCsv}
              disabled={sorted.length === 0}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-etext-muted hover:bg-surface-muted hover:text-etext disabled:opacity-50 transition-colors"
            >
              <DownloadIcon />
              CSV
            </button>
            <button
              type="button"
              onClick={onExportPdf}
              disabled={sorted.length === 0}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-etext-muted hover:bg-surface-muted hover:text-etext disabled:opacity-50 transition-colors"
            >
              <DownloadIcon />
              PDF
            </button>
          </div>
        </div>

        {/* Fila 2: presets + filtros */}
        {(((model.presets?.length ?? 0) > 0) || badgeColumns.length > 0 || rangeColumns.length > 0) && (
          <div className="flex flex-col gap-2.5 border-t border-border pt-3">
            {model.presets && model.presets.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="shrink-0 text-[11px] font-medium text-etext-soft">Rápidos:</span>
                {model.presets.map((p, i) => {
                  const isActive = filters.presets.includes(i);
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => togglePreset(i)}
                      className={[
                        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                        isActive
                          ? "border-navy bg-navy text-on-dark shadow-sm"
                          : "border-border bg-surface text-etext-muted hover:bg-surface-muted hover:text-etext",
                      ].join(" ")}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            )}

            {badgeColumns.map((col) => (
              <BadgeFilter
                key={col.key}
                column={col}
                values={badgeValues[col.key] ?? []}
                active={filters.badges[col.key] ?? []}
                onToggle={(v) => toggleBadge(col.key, v)}
                onClear={() => clearBadge(col.key)}
              />
            ))}
            {rangeColumns.map((col) => (
              <RangeFilter
                key={col.key}
                column={col}
                active={filters.ranges[col.key] ?? null}
                onSelect={(b) => setRange(col.key, b)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Paginación superior */}
      {totalPages > 1 && (
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} size="small" />
      )}

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted text-left">
                {model.severityKey && <th className="w-1 p-0" aria-hidden />}
                {model.columns.map((c) => (
                  <th
                    key={c.key}
                    className={[
                      "px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-etext-soft",
                      c.sortable ? "cursor-pointer select-none hover:text-etext" : "",
                    ].join(" ")}
                    onClick={c.sortable ? () => toggleSort(c.key) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.label}
                      {c.sortable && <SortIcon dir={sort?.key === c.key ? sort.dir : null} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={model.columns.length + (model.severityKey ? 1 : 0)}
                    className="px-4 py-12 text-center text-etext-soft"
                  >
                    Sin resultados.
                  </td>
                </tr>
              ) : (
                pageRows.map((row, i) => {
                  const sev = model.severityKey
                    ? categoryColor(renderCell(row[model.severityKey]))
                    : null;
                  return (
                    <tr
                      key={renderCell(row.id) + String(i)}
                      onClick={model.detail ? () => setDetailRow(row) : undefined}
                      className={[
                        "border-b border-border transition-colors last:border-0 hover:bg-surface-muted",
                        model.detail ? "cursor-pointer" : "",
                      ].join(" ")}
                    >
                      {model.severityKey && (
                        <td
                          className="w-1 p-0"
                          style={{ backgroundColor: sev ?? "transparent" }}
                          aria-hidden
                        />
                      )}
                      {model.columns.map((c) => (
                        <td key={c.key} className="px-4 py-3 align-middle">
                          <Cell column={c} value={row[c.key]} />
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación inferior */}
      {totalPages > 1 && (
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      )}

      {model.detail && (
        <RowDetail model={model} row={detailRow} onClose={() => setDetailRow(null)} />
      )}
    </div>
  );
}

/* ── Skeleton de carga ───────────────────────────────────────────────── */
function TableSkeleton({ model }: { model: ModelConfig }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="h-9 w-64 rounded-lg shimmer" />
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border bg-surface-muted px-4 py-3">
          <div className="h-3 w-24 rounded shimmer" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b border-border px-4 py-3.5 last:border-0">
            {model.columns.map((c) => (
              <div key={c.key} className="h-4 flex-1 rounded shimmer" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Iconos ──────────────────────────────────────────────────────────── */
function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13.5 13.5 17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M4 15h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SortIcon({ dir }: { dir: "asc" | "desc" | null }) {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden className="shrink-0">
      <path d="M6 2.5 8.5 5.5h-5L6 2.5Z" fill={dir === "asc" ? "currentColor" : "var(--text-soft)"} />
      <path d="M6 9.5 3.5 6.5h5L6 9.5Z" fill={dir === "desc" ? "currentColor" : "var(--text-soft)"} />
    </svg>
  );
}
