"use client";

import { useAdminSessionContext } from "../src/shared/auth/admin-session-context";
import { ReportsMetrics } from "../src/contexts/reports/ui/reports-metrics";

/**
 * Inner panel rendered only when the gate has authenticated.
 * Reads token and logout from AdminSessionContext (provided by AdminGate)
 * so that a 401 from the BFF collapses the gate back to the login form.
 */
export function AdminPanelInner() {
  const { token, logout } = useAdminSessionContext();
  return <ReportsMetrics token={token ?? ""} onUnauthorized={logout} />;
}
