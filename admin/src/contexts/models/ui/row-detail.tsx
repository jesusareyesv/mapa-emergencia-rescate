"use client";

import dynamic from "next/dynamic";
import { Modal } from "../../../ui";
import { badgeStyle, formatAbsolute, mapUrl } from "./cell-format";
import { renderCell } from "./table-state";
import type { ModelConfig } from "../model-registry";
import type { ModelRow } from "../application/models-gateway";

const MiniMap = dynamic(
  () => import("./mini-map").then((m) => ({ default: m.MiniMap })),
  { ssr: false, loading: () => <div style={{ height: 192, background: "#f1f5f9", borderRadius: 8 }} /> },
);

/** Ancla una ruta de foto relativa al backend; deja las absolutas intactas. */
function photoSrc(value: unknown): string | null {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s) return null;
  if (/^https?:\/\//.test(s)) return s;
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  return base ? `${base}${s.startsWith("/") ? "" : "/"}${s}` : s;
}

function FieldValue({ keyName, value }: { keyName: string; value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-etext-soft">—</span>;
  }
  if (keyName === "type" || keyName === "status" || keyName === "category") {
    const { fg, bg } = badgeStyle(renderCell(value));
    return (
      <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
        style={{ color: fg, backgroundColor: bg }}
      >
        {renderCell(value)}
      </span>
    );
  }
  if (keyName === "createdAt") {
    return <span className="text-etext">{formatAbsolute(Number(value))}</span>;
  }
  return <span className="whitespace-pre-wrap break-words text-etext">{renderCell(value)}</span>;
}

/**
 * Drawer de detalle de una fila: lista todos los campos del modelo más extras
 * de dominio (coords con link a mapa, foto). Reutiliza el Modal de src/ui.
 */
export function RowDetail({
  model,
  row,
  onClose,
}: {
  model: ModelConfig;
  row: ModelRow | null;
  onClose: () => void;
}) {
  const lat = row ? Number(row.lat) : NaN;
  const lng = row ? Number(row.lng) : NaN;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
  const photo = row ? photoSrc(row.photoUrl) : null;

  return (
    <Modal isOpen={row !== null} onClose={onClose} title={`Detalle · ${model.label}`} maxWidth="2xl">
      {row && (
        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {model.columns.map((c) => (
              <div key={c.key} className="flex flex-col gap-0.5">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-etext-soft">
                  {c.label}
                </dt>
                <dd className="text-sm">
                  <FieldValue keyName={c.key} value={row[c.key]} />
                </dd>
              </div>
            ))}
          </dl>

          {hasCoords && (
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-etext-soft">
                Ubicación
              </span>
              <MiniMap lat={lat} lng={lng} />
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono text-xs text-etext-muted">
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </span>
                <a
                  href={mapUrl(lat, lng)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs font-medium text-brand-blue hover:bg-surface-muted transition-colors"
                >
                  Ver en mapa ↗
                </a>
              </div>
            </div>
          )}

          {photo && (
            <div className="flex flex-col gap-1 border-t border-border pt-3">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-etext-soft">
                Foto
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element -- URL externa del backend, sin loader de Next */}
              <img
                src={photo}
                alt="Evidencia del reporte"
                className="max-h-64 w-auto rounded-lg border border-border object-contain"
              />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
