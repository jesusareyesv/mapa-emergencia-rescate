/**
 * Pure domain computation: aggregate Report[] into display metrics.
 *
 * Exposes exactly what ReportsMetrics renders — no unused derived data.
 */

import type { Report } from "./report";

export interface ReportMetrics {
  total: number;
  totalAffected: number;
  criticalCount: number;
}

export function computeReportMetrics(reports: Report[]): ReportMetrics {
  let totalAffected = 0;
  let criticalCount = 0;

  for (const report of reports) {
    totalAffected += report.affected;
    if (report.type === "critical") {
      criticalCount += 1;
    }
  }

  return {
    total: reports.length,
    totalAffected,
    criticalCount,
  };
}
