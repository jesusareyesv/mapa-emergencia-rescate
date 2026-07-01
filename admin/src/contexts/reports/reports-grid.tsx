"use client";

import { useMemo, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Pagination } from "@/src/ui/atoms/pagination";
import { useModelList } from "../models/ui/use-model-list";
import { badgeStyle, formatRelativeTime, toMillis } from "../models/ui/cell-format";
import { RowDetail } from "../models/ui/row-detail";
import { getModel } from "../models/model-registry";
import { downloadCsv } from "../models/ui/export-csv";
import { downloadXlsx } from "../models/ui/export-xlsx";
import { exportColumns, formatCellForExport } from "../models/ui/table-state";
import type { ModelRow } from "../models/application/models-gateway";

const PAGE_SIZE = 20;

const KNOWN_TYPES = [
  "critical",
  "supplies",
  "shelter",
  "nopower",
  "missing",
  "building",
  "starlink",
  "volunteer",
];

const TIME_FILTERS = [
  { label: "Siempre", value: "all" },
  { label: "Últimas 24h", value: "24h" },
  { label: "Últimos 7 días", value: "7d" },
  { label: "Últimos 30 días", value: "30d" },
] as const;
type TimeFilter = (typeof TIME_FILTERS)[number]["value"];

const CONFIRM_FILTERS = [
  { label: "Todos", value: "all" },
  { label: "Sin confirmar", value: "none" },
  { label: "Confirmados", value: "some" },
] as const;
type ConfirmFilter = (typeof CONFIRM_FILTERS)[number]["value"];

function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function isWithin(createdAt: unknown, ms: number): boolean {
  const t = toMillis(Number(createdAt ?? 0));
  return t > 0 && Date.now() - t <= ms;
}

function ReportCard({ row, onClick }: { row: ModelRow; onClick: () => void }) {
  const type = String(row.type ?? "").trim();
  const place = String(row.place ?? "—");
  const needs = String(row.needs ?? "");
  const affected = row.affected != null && row.affected !== "" ? Number(row.affected) : null;
  const confirmations =
    row.confirmations != null && row.confirmations !== "" ? Number(row.confirmations) : null;
  const createdAt = row.createdAt ? Number(row.createdAt) : 0;

  const { fg, bg } = badgeStyle(type);
  const timeStr = createdAt ? formatRelativeTime(createdAt) : "—";

  return (
    <div
      onClick={onClick}
      className="group flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{ color: fg, backgroundColor: bg }}
        >
          {type || "—"}
        </span>
        <span className="shrink-0 font-mono text-[11px] text-etext-soft">{timeStr}</span>
      </div>

      <p className="line-clamp-1 text-sm font-semibold leading-snug text-etext">{place}</p>

      {needs && <p className="line-clamp-2 text-xs leading-relaxed text-etext-muted">{needs}</p>}

      <div className="mt-auto flex items-center gap-2 text-[11px] font-medium text-etext-soft">
        {affected != null && <span>{affected} afect.</span>}
        {affected != null && confirmations != null && <span>·</span>}
        {confirmations != null && <span>{confirmations} confirm.</span>}
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 3v10M6 9l4 4 4-4M4 17h12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ReportsGrid() {
  const { data, isLoading, isError } = useModelList("reports");
  const model = getModel("reports")!;

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [confirmFilter, setConfirmFilter] = useState<ConfirmFilter>("all");
  const [placeFilter, setPlaceFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<ModelRow | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [xlsxLoading, setXlsxLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [typeFilters, timeFilter, confirmFilter, placeFilter]);

  const availableTypes = useMemo(() => {
    const seen = new Set<string>();
    for (const row of data ?? []) {
      const t = String(row.type ?? "")
        .trim()
        .toLowerCase();
      if (t) seen.add(t);
    }
    return [...seen].sort((a, b) => {
      const ai = KNOWN_TYPES.indexOf(a);
      const bi = KNOWN_TYPES.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [data]);

  const filtered = useMemo(() => {
    const q = normalizeText(debouncedQuery);
    const loc = normalizeText(placeFilter);
    const timeMs: Record<TimeFilter, number> = {
      all: Infinity,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };

    return (data ?? []).filter((row) => {
      if (
        typeFilters.length > 0 &&
        !typeFilters.includes(
          String(row.type ?? "")
            .trim()
            .toLowerCase(),
        )
      )
        return false;
      if (timeFilter !== "all" && !isWithin(row.createdAt, timeMs[timeFilter])) return false;
      if (confirmFilter === "none" && Number(row.confirmations ?? 0) > 0) return false;
      if (confirmFilter === "some" && Number(row.confirmations ?? 0) === 0) return false;
      if (loc && !normalizeText(String(row.place ?? "")).includes(loc)) return false;
      if (q) {
        const searchable = [row.place, row.needs, row.type]
          .map((v) => normalizeText(String(v ?? "")))
          .join(" ");
        if (!searchable.includes(q)) return false;
      }
      return true;
    });
  }, [data, typeFilters, timeFilter, confirmFilter, placeFilter, debouncedQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleCsv() {
    const cols = exportColumns(model.columns);
    const header = cols.map((c) => c.label).join(",");
    const rows = filtered
      .map((row) =>
        cols
          .map((c) => {
            const val = formatCellForExport(c, row[c.key]);
            return `"${String(val).replace(/"/g, '""')}"`;
          })
          .join(","),
      )
      .join("\n");
    downloadCsv("reportes.csv", `${header}\n${rows}`);
  }

  async function handleXlsx() {
    const activeFilters = [
      typeFilters.length > 0 ? `tipo: ${typeFilters.join(", ")}` : null,
      timeFilter !== "all" ? TIME_FILTERS.find((f) => f.value === timeFilter)?.label : null,
      confirmFilter !== "all"
        ? CONFIRM_FILTERS.find((f) => f.value === confirmFilter)?.label
        : null,
      placeFilter ? `lugar: ${placeFilter}` : null,
      debouncedQuery ? `búsqueda: ${debouncedQuery}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    await downloadXlsx(
      "reportes.xlsx",
      {
        title: "Reportes de Emergencia",
        subtitle: activeFilters || undefined,
        kpis: [
          { label: "Total", value: filtered.length },
          {
            label: "Críticos",
            value: filtered.filter((r) => String(r.type ?? "").toLowerCase() === "critical").length,
          },
          { label: "Afectados", value: filtered.reduce((s, r) => s + Number(r.affected ?? 0), 0) },
        ],
      },
      filtered,
      model.columns,
    );
  }

  async function handlePdf() {
    setPdfLoading(true);
    try {
      const { downloadPdf } = await import("../models/ui/export-pdf");
      const activeFilters = [
        typeFilters.length > 0 ? `tipo: ${typeFilters.join(", ")}` : null,
        timeFilter !== "all" ? TIME_FILTERS.find((f) => f.value === timeFilter)?.label : null,
        placeFilter ? `lugar: ${placeFilter}` : null,
        debouncedQuery ? `búsqueda: ${debouncedQuery}` : null,
      ]
        .filter(Boolean)
        .join(" · ");

      await downloadPdf(
        "reportes.pdf",
        {
          title: "Reportes de Emergencia",
          subtitle: activeFilters || undefined,
          kpis: [
            { label: "Total", value: filtered.length },
            {
              label: "Críticos",
              value: filtered.filter((r) => String(r.type ?? "").toLowerCase() === "critical")
                .length,
            },
            {
              label: "Afectados",
              value: filtered.reduce((s, r) => s + Number(r.affected ?? 0), 0),
            },
          ],
        },
        filtered,
        model.columns,
      );
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-etext">Reportes de Emergencia</h1>
        <p className="mt-1 text-sm text-etext-soft">
          Explora, filtra y exporta los reportes de emergencia activos.
        </p>
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          {/* Búsqueda */}
          <div className="relative w-full shrink-0 sm:w-[220px]">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-etext-soft">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden>
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M13.5 13.5 17 17"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Buscar reporte, lugar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-full border border-border bg-gray-50/50 py-1.5 pl-9 pr-3 text-xs text-etext placeholder:text-etext-soft focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy transition-colors dark:bg-gray-800/50"
            />
          </div>

          <div className="hidden h-4 w-px bg-border sm:block" />

          {/* Filtro de tipo — multi-select */}
          <div className="flex flex-wrap items-center justify-center gap-1 rounded-full border border-border bg-gray-50 p-0.5 shrink-0 dark:bg-gray-800/50">
            <button
              onClick={() => setTypeFilters([])}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${typeFilters.length === 0 ? "bg-navy text-on-dark shadow-sm" : "text-etext-muted hover:text-etext"}`}
            >
              Todos
            </button>
            {availableTypes.map((t) => {
              const { fg, bg } = badgeStyle(t);
              const isActive = typeFilters.includes(t);
              return (
                <button
                  key={t}
                  onClick={() =>
                    setTypeFilters((prev) =>
                      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
                    )
                  }
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-all ${isActive ? "shadow-sm" : "text-etext-muted hover:text-etext"}`}
                  style={isActive ? { color: fg, backgroundColor: bg } : {}}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <div className="hidden h-4 w-px bg-border sm:block" />

          {/* Filtro de tiempo */}
          <div className="flex items-center justify-center gap-1 rounded-full border border-border bg-gray-50 p-0.5 shrink-0 dark:bg-gray-800/50">
            {TIME_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setTimeFilter(f.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${timeFilter === f.value ? "bg-navy text-on-dark shadow-sm" : "text-etext-muted hover:text-etext"}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="hidden h-4 w-px bg-border sm:block" />

          {/* Filtro de confirmaciones */}
          <div className="flex items-center justify-center gap-1 rounded-full border border-border bg-gray-50 p-0.5 shrink-0 dark:bg-gray-800/50">
            {CONFIRM_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setConfirmFilter(f.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${confirmFilter === f.value ? "bg-navy text-on-dark shadow-sm" : "text-etext-muted hover:text-etext"}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="hidden h-4 w-px bg-border sm:block" />

          {/* Filtro de lugar */}
          <input
            type="text"
            placeholder="Lugar (ej. Caracas)"
            value={placeFilter}
            onChange={(e) => setPlaceFilter(e.target.value)}
            className="w-[130px] shrink-0 rounded-full border border-border bg-gray-50/50 px-3 py-1.5 text-xs text-etext placeholder:text-etext-soft focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy transition-colors dark:bg-gray-800/50"
          />

          <div className="hidden h-4 w-px bg-border sm:block" />

          {/* Contador + Exportar */}
          <span className="shrink-0 whitespace-nowrap px-1 text-xs font-medium text-etext-soft">
            {new Intl.NumberFormat("es-VE").format(filtered.length)} reg.
          </span>

          <button
            onClick={handleCsv}
            title="Descargar CSV (datos crudos)"
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-etext-muted transition-colors hover:bg-surface-muted hover:text-etext shrink-0"
          >
            <DownloadIcon /> CSV
          </button>

          <button
            onClick={handleXlsx}
            title="Descargar Excel (estilizado)"
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-etext-muted transition-colors hover:bg-surface-muted hover:text-etext shrink-0"
          >
            <DownloadIcon /> Excel
          </button>

          <button
            onClick={handlePdf}
            disabled={pdfLoading}
            title="Descargar PDF"
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-etext-muted transition-colors hover:bg-surface-muted hover:text-etext shrink-0 disabled:opacity-50"
          >
            <DownloadIcon /> {pdfLoading ? "..." : "PDF"}
          </button>
        </div>
      </div>

      {/* Contenido */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-transparent" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          No se pudieron cargar los reportes.
        </div>
      ) : pageRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/50 p-16 text-center">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="mb-4 text-gray-300"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <p className="text-lg font-medium text-etext-muted">No se encontraron reportes</p>
          <p className="mt-1 text-sm text-etext-soft">
            Intenta con otros filtros o términos de búsqueda.
          </p>
        </div>
      ) : (
        <>
          {totalPages > 1 && (
            <Pagination
              page={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
              size="small"
            />
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageRows.map((row) => (
              <ReportCard
                key={String(row.id ?? row.createdAt)}
                row={row}
                onClick={() => setSelectedRow(row)}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
          )}
        </>
      )}

      <RowDetail model={model} row={selectedRow} onClose={() => setSelectedRow(null)} />
    </div>
  );
}
