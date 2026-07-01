/**
 * Funciones puras para la navegación del panel admin.
 * Sin dependencias de React ni de HTTP — testables en aislamiento.
 */
import type { NavCluster, NavItem } from "@/src/config/nav";

/** Conteos que alimentan los badges de la nav. */
export interface AdminCounts {
  reports?: number;
  missing?: number;
  contactUnread?: number;
  [key: string]: number | undefined;
}

/**
 * Resuelve qué ítem de navegación está activo para el pathname actual.
 * La ruta "/" solo es activa en coincidencia exacta; las demás son por prefijo.
 */
export function resolveActiveId(pathname: string, sections: NavCluster[]): string | null {
  const items = sections.flatMap((s) => s.items);
  // Ordenar por longitud descendente para que /reports gane sobre /
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
  for (const item of sorted) {
    if (item.href === "/") {
      if (pathname === "/") return item.id;
    } else if (pathname === item.href || pathname.startsWith(item.href + "/")) {
      return item.id;
    }
  }
  return null;
}

/**
 * Filtra los clusters por capacidades del usuario.
 * Ítems con readCapability null siempre pasan. Clusters vacíos se eliminan.
 */
export function filterNavByCapabilities(
  sections: NavCluster[],
  can: (cap: string) => boolean,
): NavCluster[] {
  return sections
    .map((cluster) => ({
      ...cluster,
      items: cluster.items.filter(
        (item) => item.readCapability === null || can(item.readCapability),
      ),
    }))
    .filter((cluster) => cluster.items.length > 0);
}

/**
 * Construye el mapa badgeKey → count desde los datos disponibles.
 * Devuelve solo las claves con valor > 0.
 */
export function deriveBadgeCounts(counts: AdminCounts): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(counts)) {
    if (typeof value === "number" && value > 0) {
      result[key] = value;
    }
  }
  return result;
}

/** Devuelve los ítems que tienen badgeKey configurada. */
export function getBadgeItems(sections: NavCluster[]): NavItem[] {
  return sections.flatMap((s) => s.items).filter((i) => i.badgeKey !== undefined);
}
