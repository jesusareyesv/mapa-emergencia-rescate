/**
 * Configuración declarativa de la navegación del panel admin.
 *
 * Cada ítem declara su capacidad de lectura requerida (null = visible para todos
 * los autenticados) y una badgeKey opcional que mapea a conteos en tiempo real.
 * El shell filtra por `can(readCapability)` al renderizar; cuando los permisos por
 * operador estén activos, basta con pasar la lista de ids visibles al helper
 * `filterNavByCapabilities` sin cambiar las rutas.
 */

export interface NavItem {
  id: string;
  label: string;
  href: string;
  /** Capacidad de lectura requerida. null = visible para cualquier usuario autenticado. */
  readCapability: string | null;
  /** Clave en el mapa de conteos devuelto por `deriveBadgeCounts`. */
  badgeKey?: string;
}

export interface NavCluster {
  cluster: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavCluster[] = [
  {
    cluster: "Operación",
    items: [
      { id: "home",      label: "Inicio",        href: "/",          readCapability: null },
      { id: "reports",   label: "Reportes",      href: "/reports",   readCapability: "report:read",   badgeKey: "reports" },
      { id: "missing",   label: "Desaparecidos", href: "/missing",   readCapability: "missing:read",  badgeKey: "missing" },
      { id: "chat",      label: "Chat",          href: "/chat",      readCapability: "chat:read" },
      { id: "donations", label: "Donaciones",    href: "/donations",  readCapability: "donation:read" },
      { id: "hospitals", label: "Insumos",       href: "/hospitals",  readCapability: "hospital:read" },
      { id: "contact",   label: "Contacto",      href: "/contact",   readCapability: "contact:read",  badgeKey: "contactUnread" },
      { id: "integraciones", label: "Integraciones", href: "/integraciones", readCapability: null },
    ],
  },
  {
    cluster: "Administración",
    items: [
      { id: "users", label: "Usuarios", href: "/users", readCapability: "user:read" },
      { id: "roles", label: "Roles",    href: "/roles", readCapability: "role:read" },
      { id: "audit", label: "Auditoría", href: "/audit", readCapability: "audit:read" },
    ],
  },
];
