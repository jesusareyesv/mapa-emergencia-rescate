"use client";

import { AdminSessionProvider } from "../src/shared/auth/admin-session-provider";
import { AdminGate } from "../src/shared/auth/admin-gate";
import { AdminPanelInner } from "./admin-panel-inner";

/**
 * Composes AdminSessionProvider (owns session state + context) with the auth
 * gate and the metrics screen. A 401 from the BFF triggers logout via context,
 * collapsing AdminGate back to LoginForm.
 */
export function AdminPanel() {
  return (
    <AdminSessionProvider>
      <AdminGate>
        <AdminPanelInner />
      </AdminGate>
    </AdminSessionProvider>
  );
}
