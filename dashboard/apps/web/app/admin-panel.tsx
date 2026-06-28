"use client";

import { useAdminSession } from "../src/shared/auth/use-admin-session";
import { AdminGate } from "../src/shared/auth/admin-gate";
import { ReportsMetrics } from "../src/contexts/reports/ui/reports-metrics";

/**
 * Thin client wrapper that reads the token from the session
 * and passes it to ReportsMetrics inside the auth gate.
 */
export function AdminPanel() {
  const { token } = useAdminSession();
  return <AdminGate>{token !== null && <ReportsMetrics token={token} />}</AdminGate>;
}
