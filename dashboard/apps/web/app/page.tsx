import type { Metadata } from "next";
import { AdminPanel } from "./admin-panel";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function Page() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Panel de administración</h1>
      <AdminPanel />
    </main>
  );
}
