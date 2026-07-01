"use client";

import Link from "next/link";
import { NavIcon } from "../../config/nav-icons";
import { useModelList } from "../models/ui/use-model-list";
import type { ModelRow } from "../models/application/models-gateway";
import { useCountUp } from "./use-count-up";

export interface StatCardProps {
  /** id de nav-icons para el ícono. */
  iconId: string;
  label: string;
  /** path del modelo en el BFF (/api/models/<path>). */
  path: string;
  href: string;
  /** Color de acento (hex). */
  accent: string;
  /** Índice para escalonar la entrada. */
  index: number;
  /** Sub-línea opcional derivada de las filas. */
  derive?: (rows: ModelRow[]) => string | undefined;
}

/**
 * Tarjeta KPI: cuenta las filas de un modelo, con count-up, chip de ícono y
 * acento de color por categoría. Glow al pasar el cursor. Enlaza a la sección.
 */
export function StatCard({ iconId, label, path, href, accent, index, derive }: StatCardProps) {
  const { data, isLoading, isError } = useModelList(path);
  const rows = data ?? [];
  const count = useCountUp(rows.length);
  const sub = derive && data ? derive(rows) : undefined;

  return (
    <Link
      href={href}
      style={{ animationDelay: `${index * 70}ms`, ["--accent" as string]: accent }}
      className="stat-card-link animate-fade-up group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[0_0_0_1px_var(--accent),0_8px_24px_-12px_var(--accent)]"
    >
      {/* Barra de acento superior */}
      <span className="stat-accent-bar absolute inset-x-0 top-0 h-0.5 transition-opacity group-hover:opacity-100" />

      <div className="flex items-center justify-between">
        <span className="stat-chip grid h-9 w-9 place-items-center rounded-lg">
          <NavIcon id={iconId} className="h-[18px] w-[18px]" />
        </span>
        <ArrowIcon className="text-etext-soft transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-etext-soft">
          {label}
        </p>
        {isLoading ? (
          <span className="mt-1 block h-9 w-16 rounded shimmer" />
        ) : isError ? (
          <p className="mt-1 font-mono text-sm text-crisis">error</p>
        ) : (
          <p className="mt-0.5 font-mono text-3xl font-bold tabular-nums text-etext">
            {count}
          </p>
        )}
        {sub && <p className="mt-0.5 font-mono text-[11px]" style={{ color: accent }}>{sub}</p>}
      </div>
    </Link>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path d="M5 10h10M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
