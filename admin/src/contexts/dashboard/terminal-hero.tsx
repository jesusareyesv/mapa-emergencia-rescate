"use client";

import { useTypewriter } from "./use-typewriter";

/**
 * Banner de inicio con estética de terminal: barra de ventana, líneas de prompt
 * y un eslogan escrito con efecto máquina de escribir.
 */
export function TerminalHero({ userName }: { userName: string }) {
  const { text, done } = useTypewriter("panel de control · sistema operativo en línea");
  const now = new Date();
  const stamp = now.toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="animate-fade-up relative overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      {/* Barra de ventana */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="ml-2 font-mono text-[11px] text-etext-soft">admin@rescate: ~</span>
        <span className="ml-auto font-mono text-[11px] text-etext-soft">{stamp}</span>
      </div>

      {/* Cuerpo */}
      <div className="space-y-1 p-5 font-mono text-sm">
        <p className="text-[#15803d]">
          <span className="text-etext-soft">$</span> acceso concedido
        </p>
        <p className="text-etext-muted">
          <span className="text-etext-soft">$</span> usuario:{" "}
          <span className="font-semibold text-etext">{userName}</span>
        </p>
        <p className="text-etext">
          <span className="text-etext-soft">$</span>{" "}
          <span className={done ? "" : "dash-cursor"}>{text}</span>
        </p>
      </div>

      {/* Pie de estado */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-[11px] font-medium text-etext-muted">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[#16a34a] text-[#16a34a]" />
          en línea
        </span>
        <span className="rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-[11px] font-medium text-etext-muted">
          actualización · 30s
        </span>
      </div>
    </div>
  );
}
