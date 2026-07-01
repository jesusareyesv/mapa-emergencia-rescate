import { describe, it, expect } from "vitest";
import {
  filterRows,
  sortRows,
  paginate,
  pageCount,
  uniqueValues,
  summaryValue,
  rowsToCsv,
  EMPTY_FILTERS,
  type FilterState,
} from "@/src/contexts/models/ui/table-state";
import type { ModelConfig } from "@/src/contexts/models/model-registry";
import type { ModelRow } from "@/src/contexts/models/application/models-gateway";

const MODEL: ModelConfig = {
  path: "reports",
  label: "Reportes",
  readCapability: "report:read",
  columns: [
    { key: "id", label: "ID", variant: "id" },
    { key: "type", label: "Tipo", variant: "badge", filterable: true },
    { key: "createdAt", label: "Fecha", variant: "date", sortable: true, numeric: true },
    { key: "place", label: "Lugar" },
    {
      key: "affected",
      label: "Afectados",
      sortable: true,
      numeric: true,
      rangeBuckets: [
        { label: "0", min: 0, max: 0 },
        { label: "1–5", min: 1, max: 5 },
        { label: "6+", min: 6 },
      ],
    },
    { key: "confirmations", label: "Confirmaciones", sortable: true, numeric: true },
  ],
  presets: [
    {
      label: "Críticos sin confirmar",
      apply: (r) => String(r.type).toLowerCase() === "critical" && Number(r.confirmations) === 0,
    },
  ],
};

const ROWS: ModelRow[] = [
  { id: "a", type: "critical", place: "Caracas", affected: 0, confirmations: 0, createdAt: 1000 },
  { id: "b", type: "supplies", place: "Maracaibo", affected: 3, confirmations: 2, createdAt: 3000 },
  { id: "c", type: "critical", place: "Valencia", affected: 12, confirmations: 0, createdAt: 2000 },
  { id: "d", type: "shelter", place: "Mérida", affected: 6, confirmations: 5, createdAt: 5000 },
];

const filters = (over: Partial<FilterState>): FilterState => ({ ...EMPTY_FILTERS, ...over });

describe("filterRows", () => {
  it("sin filtros devuelve todo", () => {
    expect(filterRows(ROWS, MODEL, EMPTY_FILTERS)).toHaveLength(4);
  });

  it("búsqueda libre normaliza acentos", () => {
    const out = filterRows(ROWS, MODEL, filters({ query: "merida" }));
    expect(out.map((r) => r.id)).toEqual(["d"]);
  });

  it("filtro badge multi-select (OR dentro de la columna)", () => {
    const out = filterRows(ROWS, MODEL, filters({ badges: { type: ["critical", "shelter"] } }));
    expect(out.map((r) => r.id).sort()).toEqual(["a", "c", "d"]);
  });

  it("filtro por rango numérico", () => {
    const bucket = MODEL.columns.find((c) => c.key === "affected")!.rangeBuckets![1]!; // 1–5
    const out = filterRows(ROWS, MODEL, filters({ ranges: { affected: bucket } }));
    expect(out.map((r) => r.id)).toEqual(["b"]);
  });

  it("preset combina condiciones", () => {
    const out = filterRows(ROWS, MODEL, filters({ presets: [0] }));
    expect(out.map((r) => r.id).sort()).toEqual(["a", "c"]);
  });

  it("combina query + badge + rango", () => {
    const six = MODEL.columns.find((c) => c.key === "affected")!.rangeBuckets![2]!; // 6+
    const out = filterRows(
      ROWS,
      MODEL,
      filters({ badges: { type: ["critical"] }, ranges: { affected: six } }),
    );
    expect(out.map((r) => r.id)).toEqual(["c"]);
  });
});

describe("sortRows", () => {
  it("ordena numérico desc", () => {
    const out = sortRows(ROWS, { key: "affected", dir: "desc" }, MODEL.columns);
    expect(out.map((r) => r.affected)).toEqual([12, 6, 3, 0]);
  });

  it("ordena numérico asc", () => {
    const out = sortRows(ROWS, { key: "createdAt", dir: "asc" }, MODEL.columns);
    expect(out.map((r) => r.id)).toEqual(["a", "c", "b", "d"]);
  });

  it("ordena texto alfabético", () => {
    const out = sortRows(ROWS, { key: "place", dir: "asc" }, MODEL.columns);
    expect(out.map((r) => r.place)).toEqual(["Caracas", "Maracaibo", "Mérida", "Valencia"]);
  });

  it("sin sort no muta el orden", () => {
    expect(sortRows(ROWS, null, MODEL.columns)).toEqual(ROWS);
  });
});

describe("paginate / pageCount", () => {
  it("recorta la página pedida", () => {
    expect(paginate([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4]);
  });
  it("cuenta páginas con mínimo 1", () => {
    expect(pageCount(0, 50)).toBe(1);
    expect(pageCount(120, 50)).toBe(3);
  });
});

describe("uniqueValues", () => {
  it("devuelve valores únicos ordenados", () => {
    expect(uniqueValues(ROWS, "type")).toEqual(["critical", "shelter", "supplies"]);
  });
});

describe("summaryValue", () => {
  it("count", () => {
    expect(summaryValue(ROWS, { kind: "count" })).toBe(4);
  });
  it("sum", () => {
    expect(summaryValue(ROWS, { kind: "sum", key: "affected" })).toBe(21);
  });
  it("countWhere", () => {
    expect(
      summaryValue(ROWS, { kind: "countWhere", where: (r) => Number(r.confirmations) === 0 }),
    ).toBe(2);
  });
});

describe("rowsToCsv", () => {
  it("genera header + filas, escapando comillas", () => {
    const csv = rowsToCsv(
      [{ id: "x", note: 'di "hola"' }],
      [
        { key: "id", label: "ID" },
        { key: "note", label: "Nota" },
      ],
    );
    expect(csv).toBe('"ID","Nota"\r\n"x","di ""hola"""');
  });

  it("excluye columnas con variant 'id'", () => {
    const csv = rowsToCsv(
      [{ id: "abc", place: "Caracas" }],
      [
        { key: "id", label: "ID", variant: "id" },
        { key: "place", label: "Lugar" },
      ],
    );
    expect(csv).toBe('"Lugar"\r\n"Caracas"');
    expect(csv).not.toContain("abc");
  });

  it("formatea fechas en vez de epoch crudo", () => {
    const epoch = 1782739412995;
    const csv = rowsToCsv(
      [{ createdAt: epoch }],
      [{ key: "createdAt", label: "Fecha", variant: "date" }],
    );
    expect(csv).not.toContain(String(epoch));
    expect(csv.split("\r\n")[1]).not.toBe(`"${epoch}"`);
  });
});
