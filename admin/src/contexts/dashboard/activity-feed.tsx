"use client";

import { useModelList } from "../models/ui/use-model-list";
import { badgeStyle } from "../models/ui/cell-format";

/**
 * Log estilo terminal con los reportes más recientes. Solo muestra campos
 * operativos (tipo, lugar, nº afectados) ya visibles en la tabla de reportes.
 */
export function ActivityFeed() {
  const { data, isLoading, isError } = useModelList("reports");
  const rows = (data ?? []).slice(0, 8);

  return (
    <section className="animate-fade-up flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <h2 className="border-b border-border px-5 py-3 font-mono text-xs font-semibold uppercase tracking-widest text-etext-soft">
        <span className="text-etext-soft">$</span> actividad reciente
      </h2>

      <div className="flex-1 p-4 font-mono text-xs">
        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 rounded shimmer" />
            ))}
          </div>
        ) : isError ? (
          <p className="text-crisis">no se pudo cargar</p>
        ) : rows.length === 0 ? (
          <p className="text-etext-soft">sin actividad</p>
        ) : (
          <ul className="space-y-1.5">
            {rows.map((row, i) => {
              const type = String(row.type ?? "—");
              const place = String(row.place ?? "—");
              const affected = row.affected;
              const { fg } = badgeStyle(type);
              return (
                <li
                  key={String(row.id ?? i)}
                  className="animate-fade-up flex items-baseline gap-2 leading-relaxed"
                  style={{ animationDelay: `${i * 55}ms` }}
                >
                  <span className="text-etext-soft">&gt;</span>
                  <span className="feed-type font-semibold" style={{ ["--type" as string]: fg }}>{type}</span>
                  <span className="text-etext-soft">·</span>
                  <span className="truncate text-etext-muted">{place}</span>
                  {affected !== null && affected !== undefined && affected !== "" && (
                    <span className="ml-auto shrink-0 text-etext-soft">{String(affected)} afect.</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
