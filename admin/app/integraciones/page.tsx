import type { Metadata } from "next";
import { Shell } from "../shell";
import { IntegrationsPanel } from "../integrations-panel";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function Page() {
  return (
    <Shell>
      <div className="max-w-2xl">
        <IntegrationsPanel />
      </div>
    </Shell>
  );
}
