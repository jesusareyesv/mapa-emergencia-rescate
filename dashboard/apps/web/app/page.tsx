import type { Metadata } from "next";
import { Button } from "@repo/ui";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function Page() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Panel de administración</h1>
      <Button variant="primary" className="mt-4">
        Actualizar
      </Button>
    </main>
  );
}
