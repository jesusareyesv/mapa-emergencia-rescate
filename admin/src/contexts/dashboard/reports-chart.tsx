"use client";

import { useMemo } from "react";
import { useModelList } from "../models/ui/use-model-list";
import { badgeStyle } from "../models/ui/cell-format";

/** Distribución de reportes por tipo, en barras horizontales animadas. */
export function ReportsChart() {
  const { data, isLoading, isError } = useModelList("reports");

  const groups = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      const key = String(row.type ?? "—").trim() || "—";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const max = groups.reduce((m, g) => Math.max(m, g.count), 0);

  return (
    <section className="animate-fade-up flex flex-col rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="mb-4 font-mono text-xs font-semibold uppercase tracking-widest text-etext-soft">
        <span className="text-etext-soft">#</span> reportes por tipo
      </h2>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-5 rounded shimmer" />
          ))}
        </div>
      ) : isError ? (
        <p className="font-mono text-sm text-crisis">no se pudo cargar</p>
      ) : groups.length === 0 ? (
        <p className="font-mono text-sm text-etext-soft">sin datos</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {groups.map(({ type, count }, i) => {
            const { fg } = badgeStyle(type);
            const pct = max > 0 ? (count / max) * 100 : 0;
            return (
              <div key={type} className="flex items-center gap-3">
                <span className="w-20 shrink-0 truncate font-mono text-xs text-etext-muted" title={type}>
                  {type}
                </span>
                <div className="relative h-5 flex-1 overflow-hidden rounded bg-surface-muted">
                  <div
                    className="chart-bar bar-fill h-full rounded"
                    style={{ width: `${pct}%`, ["--bar" as string]: fg, animationDelay: `${i * 60}ms` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right font-mono text-xs font-semibold tabular-nums text-etext">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
