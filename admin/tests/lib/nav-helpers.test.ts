import { describe, it, expect } from "vitest";
import {
  resolveActiveId,
  filterNavByCapabilities,
  deriveBadgeCounts,
} from "@/src/lib/nav-helpers";
import type { NavCluster } from "@/src/config/nav";

const SECTIONS: NavCluster[] = [
  {
    cluster: "Operación",
    items: [
      { id: "home",    label: "Inicio",   href: "/",        readCapability: null },
      { id: "reports", label: "Reportes", href: "/reports", readCapability: "report:read", badgeKey: "reports" },
      { id: "contact", label: "Contacto", href: "/contact", readCapability: "contact:read", badgeKey: "contactUnread" },
    ],
  },
  {
    cluster: "Administración",
    items: [
      { id: "users", label: "Usuarios", href: "/users", readCapability: "user:read" },
      { id: "roles", label: "Roles",    href: "/roles", readCapability: "role:read" },
    ],
  },
];

// ---------------------------------------------------------------------------
// resolveActiveId
// ---------------------------------------------------------------------------
describe("resolveActiveId", () => {
  it("home es activo solo en /", () => {
    expect(resolveActiveId("/", SECTIONS)).toBe("home");
  });

  it("no activa home para /reports", () => {
    expect(resolveActiveId("/reports", SECTIONS)).toBe("reports");
  });

  it("activa un ítem por prefijo de subruta", () => {
    expect(resolveActiveId("/reports/123", SECTIONS)).toBe("reports");
  });

  it("activa /users correctamente", () => {
    expect(resolveActiveId("/users", SECTIONS)).toBe("users");
  });

  it("devuelve null para ruta desconocida", () => {
    expect(resolveActiveId("/unknown-path", SECTIONS)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// filterNavByCapabilities
// ---------------------------------------------------------------------------
describe("filterNavByCapabilities", () => {
  const canAll = () => true;
  const canNone = () => false;
  const canReports = (cap: string) => cap === "report:read";

  it("admin con acceso total ve todos los clusters e ítems", () => {
    const result = filterNavByCapabilities(SECTIONS, canAll);
    expect(result).toHaveLength(2);
    expect(result[0].items).toHaveLength(3);
    expect(result[1].items).toHaveLength(2);
  });

  it("sin capacidades solo ve ítems con readCapability null (home)", () => {
    const result = filterNavByCapabilities(SECTIONS, canNone);
    expect(result).toHaveLength(1);
    expect(result[0].items).toHaveLength(1);
    expect(result[0].items[0].id).toBe("home");
  });

  it("con solo report:read ve home + reports; el cluster Administración desaparece", () => {
    const result = filterNavByCapabilities(SECTIONS, canReports);
    expect(result).toHaveLength(1);
    const ids = result[0].items.map((i) => i.id);
    expect(ids).toContain("home");
    expect(ids).toContain("reports");
    expect(ids).not.toContain("contact");
  });

  it("clusters vacíos se eliminan", () => {
    const result = filterNavByCapabilities(SECTIONS, canNone);
    expect(result.every((c) => c.items.length > 0)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// deriveBadgeCounts
// ---------------------------------------------------------------------------
describe("deriveBadgeCounts", () => {
  it("incluye claves con valor > 0", () => {
    const result = deriveBadgeCounts({ reports: 5, contactUnread: 2 });
    expect(result).toEqual({ reports: 5, contactUnread: 2 });
  });

  it("excluye claves con valor 0", () => {
    const result = deriveBadgeCounts({ reports: 0, contactUnread: 3 });
    expect(result).not.toHaveProperty("reports");
    expect(result.contactUnread).toBe(3);
  });

  it("devuelve objeto vacío si todos son 0 o undefined", () => {
    expect(deriveBadgeCounts({ reports: 0, missing: undefined })).toEqual({});
  });
});
