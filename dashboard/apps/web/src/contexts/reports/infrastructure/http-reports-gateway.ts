/**
 * Infrastructure adapter: implements ReportsGateway via HTTP.
 *
 * Calls GET /api/admin/data on the emergency API, extracts the `reports`
 * array, and maps each item to a domain Report via report-mapper.
 *
 * All error paths return Result — no throw in this layer.
 * The only sanctioned throw in this context is the React Query boundary
 * in use-reports.ts, required by TanStack Query's error contract.
 */

import { createHttpClient } from "../../../shared/http/http-client";
import { err } from "../../../shared/result";
import { getApiBaseUrl } from "../../../config/api-registry";
import type { ReportsGateway } from "../application/reports-gateway";
import type { Result } from "../../../shared/result";
import type { Report } from "../domain/report";
import { toReport } from "./report-mapper";

type AdminDataResponse = {
  reports: unknown[];
  [key: string]: unknown;
};

export function createHttpReportsGateway(): ReportsGateway {
  const client = createHttpClient({ baseUrl: getApiBaseUrl("emergency") });

  return {
    async list(token: string): Promise<Result<Report[]>> {
      const result = await client.get<AdminDataResponse>("/api/admin/data", {
        headers: { "x-admin-token": token },
      });

      if (!result.ok) {
        return result;
      }

      const payload = result.value;
      const rawReports = payload.reports;

      if (!Array.isArray(rawReports)) {
        return err({ kind: "parse", message: "admin data response missing reports array" });
      }

      const reports: Report[] = [];
      for (const item of rawReports) {
        const mapped = toReport(item);
        if (!mapped.ok) {
          return mapped;
        }
        reports.push(mapped.value);
      }

      return { ok: true, value: reports };
    },
  };
}
