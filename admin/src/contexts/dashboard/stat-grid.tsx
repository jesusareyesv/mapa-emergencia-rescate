"use client";

import { useAdminSessionContext } from "../../shared/auth/admin-session-context";
import { StatCard, type StatCardProps } from "./stat-card";
import type { ModelRow } from "../models/application/models-gateway";

type StatConfig = Omit<StatCardProps, "index"> & { cap: string };

const STR = (v: unknown) => String(v ?? "").trim().toLowerCase();

const STATS: StatConfig[] = [
  {
    cap: "report:read",
    iconId: "reports",
    label: "Reportes",
    path: "reports",
    href: "/reports",
    accent: "#092334",
    derive: (rows: ModelRow[]) => {
      const n = rows.filter((r) => STR(r.type) === "critical").length;
      return n > 0 ? `${n} críticos` : undefined;
    },
  },
  {
    cap: "missing:read",
    iconId: "missing",
    label: "Desaparecidos",
    path: "missing",
    href: "/missing",
    accent: "#092334",
    derive: (rows: ModelRow[]) => {
      const located = new Set(["found", "localizada", "resolved"]);
      const n = rows.filter((r) => !located.has(STR(r.status))).length;
      return n > 0 ? `${n} sin localizar` : undefined;
    },
  },
  { cap: "hospital:read", iconId: "hospitals", label: "Hospitales", path: "hospitals", href: "/hospitals", accent: "#092334" },
  { cap: "patient:read", iconId: "patients", label: "Pacientes", path: "patients", href: "/patients", accent: "#092334" },
  { cap: "donation:read", iconId: "donations", label: "Donaciones", path: "donations", href: "/donations", accent: "#092334" },
  { cap: "chat:read", iconId: "chat", label: "Mensajes", path: "chat", href: "/chat", accent: "#092334" },
  { cap: "contact:read", iconId: "contact", label: "Contacto", path: "contact", href: "/contact", accent: "#092334" },
];

/** Grid de KPIs gateado por capacidades; cada tarjeta trae su propio dato. */
export function StatGrid() {
  const { can } = useAdminSessionContext();
  const visible = STATS.filter((s) => can(s.cap));

  if (visible.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {visible.map((s, i) => (
        <StatCard key={s.path} {...s} index={i} />
      ))}
    </div>
  );
}
