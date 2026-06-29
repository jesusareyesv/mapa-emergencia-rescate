"use client";

import { useId, useState, type ReactNode } from "react";

type Tab = { label: string; content: ReactNode };

/**
 * Barra de pestañas para alternar entre documentos dentro de la misma página.
 * Cada panel llega como `content` (server-rendered) en un array explícito; se
 * evita `Children.toArray` porque aplana los Fragments de cada documento.
 */
export default function DocTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(0);
  const baseId = useId();

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-[var(--eborder)] bg-[var(--esurf)]/95 backdrop-blur">
        <div
          role="tablist"
          aria-label="Documentos"
          className="mx-auto flex w-full max-w-[1120px] gap-1 px-4 sm:px-6"
        >
          {tabs.map((tab, i) => {
            const selected = i === active;
            return (
              <button
                key={tab.label}
                role="tab"
                type="button"
                id={`${baseId}-tab-${i}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${i}`}
                onClick={() => setActive(i)}
                className={`-mb-px border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  selected
                    ? "border-sky-600 text-[var(--etext)]"
                    : "border-transparent text-[var(--etext3)] hover:text-[var(--etext)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-${active}`}
        aria-labelledby={`${baseId}-tab-${active}`}
      >
        {tabs[active].content}
      </div>
    </>
  );
}
