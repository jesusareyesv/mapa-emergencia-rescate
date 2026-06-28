/**
 * Infrastructure adapter: implements ReportsGateway via HTTP.
 *
 * Calls GET /api/admin/data on the emergency API, extracts the `reports`
 * array, and maps each item to a domain Report via report-mapper.
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
  return {
    async list(token: string): Promise<Result<Report[]>> {
      const client = createHttpClient({ baseUrl: getApiBaseUrl("emergency") });

      const result = await client.get<AdminDataResponse>("/api/admin/data", {
        headers: { "x-admin-token": token },
      });

      if (!result.ok) {
        return result;
      }

      const payload = result.value;

      // Guard: 304 NotModified is not expected here but handle gracefully
      if ("notModified" in payload && (payload as { notModified?: boolean }).notModified === true) {
        return err({ kind: "parse", message: "Unexpected 304 response from admin data endpoint" });
      }

      const rawReports = (payload as AdminDataResponse).reports;

      if (!Array.isArray(rawReports)) {
        return err({ kind: "parse", message: "admin data response missing reports array" });
      }

      try {
        const reports: Report[] = rawReports.map((item) => toReport(item));
        return { ok: true, value: reports };
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to map reports";
        return err({ kind: "parse", message });
      }
    },
  };
}
