"use client";

import { useAdminSessionContext } from "../../shared/auth/admin-session-context";
import { TerminalHero } from "./terminal-hero";
import { StatGrid } from "./stat-grid";
import { ReportsChart } from "./reports-chart";
import { ActivityFeed } from "./activity-feed";
import { ModuleGrid } from "./module-grid";

/** Inicio del panel: hero terminal, KPIs, distribución, actividad y módulos. */
export function Dashboard() {
  const { user, can } = useAdminSessionContext();
  const userName = (user?.email ?? "operador").split("@")[0] || "operador";
  const showReports = can("report:read");

  return (
    <div className="flex flex-col gap-6">
      <TerminalHero userName={userName} />

      <StatGrid />

      {showReports && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ReportsChart />
          <ActivityFeed />
        </div>
      )}

      <ModuleGrid />
    </div>
  );
}
