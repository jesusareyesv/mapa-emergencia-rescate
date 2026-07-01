"use client";

import { RequireCapability } from "../../src/shared/auth/admin-gate";
import { RolesList } from "../../src/contexts/roles/roles-list";
import { RoleCreateForm } from "../../src/contexts/roles/role-create-form";

/**
 * Pantalla de administración de roles: lista (role:read) + creación
 * (role:create). Cada bloque gateado por su capacidad (UX; el backend hace la
 * autorización real).
 */
export function RolesAdmin() {
  return (
    <div>
      <RequireCapability cap="role:create">
        <section className="mb-6 flex justify-end">
          <RoleCreateForm />
        </section>
      </RequireCapability>

      <RequireCapability
        cap="role:read"
        fallback={<p className="text-sm text-crisis">No tienes permiso para ver roles (role:read).</p>}
      >
        <RolesList />
      </RequireCapability>
    </div>
  );
}
