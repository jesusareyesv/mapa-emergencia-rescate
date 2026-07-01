import type { Metadata } from "next";
import { Shell } from "../shell";
import { RequireCapability } from "../../src/shared/auth/admin-gate";
import { ReportsGrid } from "../../src/contexts/reports/reports-grid";

export const metadata: Metadata = {
  title: "Reportes | F1 Admin",
  description: "Explora, filtra y exporta los reportes de emergencia.",
  robots: { index: false },
};

export default function ReportsPage() {
  return (
    <Shell>
      <div className="flex flex-col gap-6 p-6">
        <RequireCapability
          cap="report:read"
          fallback={
            <p className="text-sm text-crisis">
              No tienes permiso para ver los reportes (report:read).
            </p>
          }
        >
          <ReportsGrid />
        </RequireCapability>
      </div>
    </Shell>
  );
}
