import { describe, expect, it } from "vitest";
import { computeReportMetrics } from "@/src/contexts/reports/domain/report-metrics";
import type { Report } from "@/src/contexts/reports/domain/report";

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: "r1",
    type: "supplies",
    lat: 0,
    lng: 0,
    place: "Test",
    affected: 0,
    needs: "none",
    photoUrl: null,
    confirmations: 0,
    createdAt: 1700000000000,
    ...overrides,
  };
}

describe("computeReportMetrics", () => {
  it("returns zeros for an empty list", () => {
    const metrics = computeReportMetrics([]);

    expect(metrics.total).toBe(0);
    expect(metrics.totalAffected).toBe(0);
    expect(metrics.criticalCount).toBe(0);
  });

  it("counts total reports correctly across mixed types", () => {
    const reports = [
      makeReport({ type: "critical" }),
      makeReport({ type: "supplies" }),
      makeReport({ type: "shelter" }),
    ];

    const metrics = computeReportMetrics(reports);

    expect(metrics.total).toBe(3);
  });

  it("sums affected across all report types", () => {
    const reports = [
      makeReport({ type: "critical", affected: 10 }),
      makeReport({ type: "supplies", affected: 5 }),
      makeReport({ type: "shelter", affected: 3 }),
    ];

    const metrics = computeReportMetrics(reports);

    expect(metrics.totalAffected).toBe(18);
  });

  it("counts only critical-type reports in criticalCount", () => {
    const reports = [
      makeReport({ type: "critical", id: "c1" }),
      makeReport({ type: "supplies", id: "s1" }),
      makeReport({ type: "critical", id: "c2" }),
      makeReport({ type: "nopower", id: "n1" }),
    ];

    const metrics = computeReportMetrics(reports);

    expect(metrics.criticalCount).toBe(2);
  });

  it("reports with zero affected do not inflate totalAffected", () => {
    const reports = [makeReport({ affected: 0 }), makeReport({ affected: 0 })];

    const metrics = computeReportMetrics(reports);

    expect(metrics.totalAffected).toBe(0);
  });
});
