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
  it("maps a complete DTO to a Report domain object", () => {
    const report = toReport(BASE_DTO);

    expect(report.id).toBe("report-1");
    expect(report.type).toBe("critical");
    expect(report.lat).toBe(39.47);
    expect(report.lng).toBe(-0.38);
    expect(report.place).toBe("Valencia centre");
    expect(report.affected).toBe(5);
    expect(report.needs).toBe("Water and food");
    expect(report.photoUrl).toBe("/api/photos/report-1");
    expect(report.confirmations).toBe(3);
    expect(report.createdAt).toBe(1700000000000);
  });

  it("maps photoUrl: null to null on the domain object", () => {
    const dto = { ...BASE_DTO, photoUrl: null };
    const report = toReport(dto);

    expect(report.photoUrl).toBeNull();
  });

  it("ignores extra/unknown fields in the DTO", () => {
    const dtoWithExtras = { ...BASE_DTO, extraField: "should-be-ignored", anotherExtra: 42 };
    const report = toReport(dtoWithExtras);

    expect(report).not.toHaveProperty("extraField");
    expect(report).not.toHaveProperty("anotherExtra");
  });

  it("throws when id is missing", () => {
    const { id: _id, ...dtoWithoutId } = BASE_DTO;
    expect(() => toReport(dtoWithoutId)).toThrow();
  });

  it("maps all valid ReportType values", () => {
    const types = ["critical", "supplies", "shelter", "nopower", "missing", "building", "starlink"];
    for (const type of types) {
      const dto = { ...BASE_DTO, type };
      const report = toReport(dto);
      expect(report.type).toBe(type);
    }
  });
});
