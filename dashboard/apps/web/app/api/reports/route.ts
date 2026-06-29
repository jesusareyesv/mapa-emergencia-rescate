/**
 * BFF route: GET /api/reports
 *
 * Composition root: wires the HTTP gateway with the use case and exposes
 * clean domain Report[] to the browser.
 *
 * - 200 Report[]  — success
 * - 401           — missing/invalid admin token
 * - 502           — upstream unreachable or unexpected error
 */

import { NextResponse } from "next/server";
import { getAdminToken } from "../../../src/shared/auth/admin-token";
import { listReports } from "../../../src/contexts/reports/application/list-reports";
import { createHttpReportsGateway } from "../../../src/contexts/reports/infrastructure/http-reports-gateway";
import { BFF_CACHE_HEADERS } from "../_shared/bff-cache";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  const token = getAdminToken(request);
  if (token === null) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: BFF_CACHE_HEADERS },
    );
  }

  const gateway = createHttpReportsGateway();
  const result = await listReports(gateway, token);

  if (result.ok) {
    return NextResponse.json(result.value, { status: 200, headers: BFF_CACHE_HEADERS });
  }

  const { kind } = result.error;
  if (kind === "auth") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: BFF_CACHE_HEADERS },
    );
  }

  return NextResponse.json(
    { error: "Upstream service error" },
    { status: 502, headers: BFF_CACHE_HEADERS },
  );
}
