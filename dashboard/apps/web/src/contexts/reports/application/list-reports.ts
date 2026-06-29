/**
 * Use case: list all reports.
 *
 * Pure delegation to the gateway — thin by design (YAGNI).
 * The route test exercises this path end-to-end via the real HTTP adapter + MSW.
 */

import type { Result } from "../../../shared/result";
import type { Report } from "../domain/report";
import type { ReportsGateway } from "./reports-gateway";

export function listReports(gateway: ReportsGateway, token: string): Promise<Result<Report[]>> {
  return gateway.list(token);
}
