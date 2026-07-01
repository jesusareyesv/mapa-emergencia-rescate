"use client";

import { useCallback, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Input, Button } from "@/src/ui";
import { RequireCapability } from "../../src/shared/auth/admin-gate";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

interface AuditEntry {
  id: number;
  actorUserId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: unknown;
  createdAt: number;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const TARGET_TYPES = [
  { value: "", label: "Todos" },
  { value: "report", label: "Reportes" },
  { value: "missing", label: "Desaparecidos" },
  { value: "hospital", label: "Hospitales" },
  { value: "patient", label: "Pacientes" },
  { value: "donation", label: "Donaciones" },
  { value: "chat", label: "Chat" },
  { value: "contact", label: "Contacto" },
  { value: "user", label: "Usuarios" },
  { value: "role", label: "Roles" },
  { value: "grant", label: "Grants" },
];

function formatTimestamp(epochMs: number): string {
  const d = new Date(epochMs);
  return d.toLocaleString("es-VE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function relativeTime(epochMs: number): string {
  const diff = Date.now() - epochMs;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "hace unos segundos";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days}d`;
  const months = Math.floor(days / 30);
  return `hace ${months}mes(es)`;
}

function MetadataCell({ metadata }: { metadata: unknown }) {
  const [open, setOpen] = useState(false);
  if (metadata === null || metadata === undefined) return <span className="text-gray-400">—</span>;
  const preview = JSON.stringify(metadata);
  const short = preview.length > 40 ? preview.slice(0, 40) + "…" : preview;
  return (
    <div className="font-mono text-[11px] text-etext-muted">
      <button type="button" onClick={() => setOpen((v) => !v)} className="text-left hover:text-navy transition-colors">
        {open ? preview : short}
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

const PAGE_LIMIT = 50;

export function AuditAdmin() {
  const [targetType, setTargetType] = useState("");
  const [actionQuery, setActionQuery] = useState("");
  const [actorQuery, setActorQuery] = useState("");
  const [beforeCursor, setBeforeCursor] = useState<number | null>(null);

  const buildUrl = useCallback(
    (cursor: number | null) => {
      const params = new URLSearchParams();
      if (targetType) params.set("targetType", targetType);
      if (actorQuery.trim()) params.set("actorUserId", actorQuery.trim());
      params.set("limit", String(PAGE_LIMIT));
      if (cursor) params.set("before", String(cursor));
      return `/api/admin/audit?${params.toString()}`;
    },
    [targetType, actorQuery],
  );

  const { data, isLoading, isError, error, isFetching } = useQuery<AuditEntry[]>({
    queryKey: ["admin-audit", targetType, actorQuery, beforeCursor],
    queryFn: async () => {
      const res = await fetch(buildUrl(beforeCursor));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<AuditEntry[]>;
    },
    placeholderData: keepPreviousData,
  });

  const entries = data ?? [];
  const filtered = actionQuery
    ? entries.filter((e) => e.action.toLowerCase().includes(actionQuery.toLowerCase()))
    : entries;
  const hasMore = entries.length === PAGE_LIMIT;
  const lastEntry = entries[entries.length - 1];
  const lastId = lastEntry?.id ?? null;

  function handleApplyFilters() {
    setBeforeCursor(null);
  }

  return (
    <RequireCapability
      cap="audit:read"
      fallback={
        <p className="mt-4 text-sm text-crisis bg-crisis/10 p-4 rounded-xl inline-block font-medium">
          No tienes permiso para ver la auditoría (audit:read).
        </p>
      }
    >
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-etext">Auditoría</h1>
          <p className="mt-1 text-sm text-etext-muted">Bitácora de acciones del sistema.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <label htmlFor="audit-target-type" className="text-sm font-semibold text-etext">
              Tipo de objeto
            </label>
            <select
              id="audit-target-type"
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-etext focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy transition-colors cursor-pointer"
            >
              {TARGET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Acción"
            type="search"
            placeholder="Filtrar por acción…"
            value={actionQuery}
            onChange={(e) => setActionQuery(e.target.value)}
            className="w-full sm:w-auto min-w-[200px]"
          />
          <Input
            label="Actor (user ID)"
            type="search"
            placeholder="Filtrar por actor…"
            value={actorQuery}
            onChange={(e) => setActorQuery(e.target.value)}
            className="w-full sm:w-auto min-w-[200px]"
          />
          <Button
            type="button"
            onClick={handleApplyFilters}
          >
            Aplicar filtros
          </Button>
        </div>

        {/* Status */}
        {isLoading && (
          <div className="flex justify-center p-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-transparent" />
          </div>
        )}
        {isError && (
          <p role="alert" className="text-sm text-crisis bg-crisis/10 p-4 rounded-xl font-medium">
            Error al cargar: {error instanceof Error ? error.message : "desconocido"}
          </p>
        )}

        {/* Table */}
        {!isLoading && !isError && (
          <div className="flex flex-col gap-6">
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-muted/50 text-left">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-etext-muted">Fecha</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-etext-muted">Actor</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-etext-muted">Acción</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-etext-muted">Objeto</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-etext-muted">ID</th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-etext-muted">Metadata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-etext-muted">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                              <path d="M3 9h18" />
                            </svg>
                            <p>Sin entradas de auditoría.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((entry) => (
                        <tr key={entry.id} className="group transition-colors hover:bg-surface-muted/30">
                          <td
                            className="whitespace-nowrap px-5 py-3 align-top text-etext-muted text-xs font-medium"
                            title={formatTimestamp(entry.createdAt)}
                          >
                            {relativeTime(entry.createdAt)}
                          </td>
                          <td className="px-5 py-3 align-top font-mono text-xs text-etext">
                            {entry.actorUserId ?? <span className="text-gray-400 italic font-sans">sistema</span>}
                          </td>
                          <td className="px-5 py-3 align-top">
                            <span className="inline-flex items-center rounded-full bg-navy/10 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-navy">
                              {entry.action}
                            </span>
                          </td>
                          <td className="px-5 py-3 align-top text-etext-muted font-medium text-xs">
                            {entry.targetType ?? "—"}
                          </td>
                          <td className="px-5 py-3 align-top font-mono text-[11px] text-etext-muted">
                            {entry.targetId ?? "—"}
                          </td>
                          <td className="px-5 py-3 align-top">
                            <MetadataCell metadata={entry.metadata} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setBeforeCursor(lastId)}
                  disabled={isFetching}
                >
                  {isFetching ? "Cargando…" : "Cargar más entradas"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </RequireCapability>
  );
}
