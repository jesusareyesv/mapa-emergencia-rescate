import type { Metadata } from "next";
import { RequireCapability } from "../../src/shared/auth/admin-gate";
import { MissingGrid } from "../../src/contexts/missing/missing-grid";
import { getModel } from "../../src/contexts/models/model-registry";
import { Shell } from "../shell";

export const metadata: Metadata = {
  title: "Desaparecidos | F1 Admin",
  description: "Directorio visual de personas desaparecidas",
};

export default function MissingPage() {
  const model = getModel("missing");
  
  // Si por alguna razón no existe el modelo en el registry, usamos un fallback genérico.
  const cap = model?.readCapability ?? "missing:read";

  return (
    <Shell>
      <div className="flex flex-col gap-6 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-etext">Directorio de Desaparecidos</h1>
          <p className="mt-1 text-sm text-etext-soft">
            Explora y gestiona los reportes de personas desaparecidas y localizadas.
          </p>
        </div>

        <RequireCapability
          cap={cap}
          fallback={
            <p className="text-sm text-crisis">
              No tienes permiso para ver este directorio ({cap}).
            </p>
          }
        >
          <MissingGrid />
        </RequireCapability>
      </div>
    </Shell>
  );
}
