"use client";

import { AdminGate } from "../src/shared/auth/admin-gate";
import { AdminPanelInner } from "./admin-panel-inner";

/**
 * Composes the auth gate with the metrics screen.
 * Session state is owned by AdminGate; AdminPanelInner
 * consumes it via context so a 401 logout collapses back to login.
 */
export function AdminPanel() {
  return (
    <AdminGate>
      <AdminPanelInner />
    </AdminGate>
  );
}
