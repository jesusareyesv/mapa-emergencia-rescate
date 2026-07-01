/**
 * Colores de pill para valores categóricos de las tablas (tipos de reporte,
 * estados, categorías). Usa los colores de capas de DESIGN.md. Valor desconocido
 * cae en un neutro legible.
 */

/** Color base por valor conocido (en minúsculas). */
const COLORS: Record<string, string> = {
  // Tipos de reporte
  critical:  "#c41a1a",
  supplies:  "#092334",
  shelter:   "#092334",
  nopower:   "#092334",
  missing:   "#092334",
  building:  "#092334",
  starlink:  "#092334",
  volunteer: "#092334",
  // Estados / categorías
  active:     "#092334",
  found:      "#16a34a",
  localizada: "#16a34a",
  resolved:   "#16a34a",
  invited:    "#092334",
  disabled:   "#94a3b8",
  suspended:  "#94a3b8",
};

const NEUTRAL = "#64748b";

export interface BadgeStyle {
  /** Color del texto. */
  fg: string;
  /** Fondo suave (color base a ~12% alpha). */
  bg: string;
}

/** Devuelve los colores de pill para un valor categórico. */
export function badgeStyle(value: string): BadgeStyle {
  const base = COLORS[value.trim().toLowerCase()] ?? NEUTRAL;
  return { fg: base, bg: base + "1F" }; // 1F ≈ 12% alpha
}

/** Color base de un valor categórico (para borde de severidad, etc.). */
export function categoryColor(value: string): string {
  return COLORS[value.trim().toLowerCase()] ?? NEUTRAL;
}

/** Normaliza un epoch que puede venir en segundos o milisegundos a ms. */
export function toMillis(epoch: number): number {
  if (!epoch) return 0;
  return epoch < 1e12 ? epoch * 1000 : epoch;
}

const RELATIVE_STEPS: [limitSeconds: number, divisor: number, unit: Intl.RelativeTimeFormatUnit][] = [
  [60, 1, "second"],
  [3600, 60, "minute"],
  [86400, 3600, "hour"],
  [604800, 86400, "day"],
  [2629800, 604800, "week"],
  [31557600, 2629800, "month"],
  [Infinity, 31557600, "year"],
];

const relFmt =
  typeof Intl !== "undefined" && "RelativeTimeFormat" in Intl
    ? new Intl.RelativeTimeFormat("es", { numeric: "auto" })
    : null;

/** Tiempo relativo en español ("hace 2 h", "ayer"). Acepta epoch en s o ms. */
export function formatRelativeTime(epoch: number, now = Date.now()): string {
  const ms = toMillis(epoch);
  if (!ms) return "—";
  const diffSec = Math.round((ms - now) / 1000);
  const abs = Math.abs(diffSec);
  for (const [limit, divisor, unit] of RELATIVE_STEPS) {
    if (abs < limit) {
      const value = Math.round(diffSec / divisor);
      return relFmt ? relFmt.format(value, unit) : `${Math.abs(value)} ${unit}`;
    }
  }
  return "—";
}

/** Fecha y hora absolutas en español (para tooltip/detalle). */
export function formatAbsolute(epoch: number): string {
  const ms = toMillis(epoch);
  if (!ms) return "—";
  return new Date(ms).toLocaleString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** URL a OpenStreetMap centrada en unas coordenadas (sin dependencias). */
export function mapUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
}
