"use client";

import Link from "next/link";
import { useAdminSessionContext } from "../../shared/auth/admin-session-context";
import { NAV_SECTIONS } from "../../config/nav";
import { NavIcon } from "../../config/nav-icons";
import { filterNavByCapabilities } from "../../lib/nav-helpers";

/** Acceso rápido a todos los módulos accesibles, agrupados por cluster. */
export function ModuleGrid() {
  const { can } = useAdminSessionContext();
  const sections = filterNavByCapabilities(NAV_SECTIONS, can);

  return (
    <div className="flex flex-col gap-6">
      {sections.map((cluster) => (
        <section key={cluster.cluster} className="animate-fade-up">
          <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-etext-soft">
            <span className="text-etext-soft">~/</span>{cluster.cluster}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {cluster.items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-etext-soft/40 hover:shadow-md"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-muted text-etext-muted transition-colors group-hover:text-etext">
                  <NavIcon id={item.id} className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-etext">
                  {item.label}
                </span>
                <span className="text-etext-soft opacity-0 transition-opacity group-hover:opacity-100">→</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
