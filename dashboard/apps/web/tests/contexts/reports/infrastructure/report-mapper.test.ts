import { describe, expect, it } from "vitest";
import { toReport } from "@/src/contexts/reports/infrastructure/report-mapper";

const BASE_DTO = {
  id: "report-1",
  type: "critical",
  lat: 39.47,
  lng: -0.38,
  place: "Valencia centre",
  affected: 5,
  needs: "Water and food",
  photoUrl: "/api/photos/report-1",
  confirmations: 3,
  createdAt: 1700000000000,
};

describe("toReport", () => {
  it("maps a complete DTO to ok(Report)", () => {
    const result = toReport(BASE_DTO);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.id).toBe("report-1");
    expect(result.value.type).toBe("critical");
    expect(result.value.lat).toBe(39.47);
    expect(result.value.lng).toBe(-0.38);
    expect(result.value.place).toBe("Valencia centre");
    expect(result.value.affected).toBe(5);
    expect(result.value.needs).toBe("Water and food");
    expect(result.value.photoUrl).toBe("/api/photos/report-1");
    expect(result.value.confirmations).toBe(3);
    expect(result.value.createdAt).toBe(1700000000000);
  });

  it("maps photoUrl: null to ok(Report) with photoUrl null", () => {
    const dto = { ...BASE_DTO, photoUrl: null };
    const result = toReport(dto);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.photoUrl).toBeNull();
  });

  it("ignores extra/unknown fields in the DTO", () => {
    const dtoWithExtras = { ...BASE_DTO, extraField: "should-be-ignored", anotherExtra: 42 };
    const result = toReport(dtoWithExtras);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).not.toHaveProperty("extraField");
    expect(result.value).not.toHaveProperty("anotherExtra");
  });

  it("returns err with kind=parse when id is missing", () => {
    const { id: _id, ...dtoWithoutId } = BASE_DTO;
    const result = toReport(dtoWithoutId);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("parse");
  });

  it("returns err with kind=parse for null input", () => {
    const result = toReport(null);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("parse");
  });

  it("returns err with kind=parse for unknown ReportType", () => {
    const dto = { ...BASE_DTO, type: "not-a-real-type" };
    const result = toReport(dto);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("parse");
  });

  it("maps all valid ReportType values to ok", () => {
    const types = ["critical", "supplies", "shelter", "nopower", "missing", "building", "starlink"];
    for (const type of types) {
      const dto = { ...BASE_DTO, type };
      const result = toReport(dto);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.value.type).toBe(type);
    }
  });
});
