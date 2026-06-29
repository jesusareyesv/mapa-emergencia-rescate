"use client";

import { useEffect } from "react";
import { MetricCard } from "@repo/ui";
import { useReports, UnauthorizedError } from "./use-reports";
import { computeReportMetrics } from "../domain/report-metrics";

interface ReportsMetricsProps {
  token: string;
  onUnauthorized: () => void;
}

export function ReportsMetrics({ token, onUnauthorized }: ReportsMetricsProps) {
  const { data: reports, isLoading, isError, error } = useReports(token);

  useEffect(() => {
    if (isError && error instanceof UnauthorizedError) {
      onUnauthorized();
    }
  }, [isError, error, onUnauthorized]);

  if (isLoading) {
    return <p>Cargando métricas...</p>;
  }

  if (isError || !reports) {
    return <p>Error al cargar los reportes.</p>;
  }

  const { total, totalAffected, criticalCount } = computeReportMetrics(reports);

  return (
    <section aria-label="Métricas de reportes">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <MetricCard label="Total reportes" value={total} />
        <MetricCard label="Total afectados" value={totalAffected} />
        <MetricCard label="Reportes críticos" value={criticalCount} />
      </div>
    </section>
  );
}
