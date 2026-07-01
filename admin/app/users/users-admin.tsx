"use client";

import { useState } from "react";
import { Button } from "@/src/ui";
import { RequireCapability } from "../../src/shared/auth/admin-gate";
import { UsersTable } from "../../src/contexts/users/users-table";
import { InviteForm } from "../../src/contexts/invitations/invite-form";

/**
 * Gestión de usuarios centralizada: invitar (user:invite) + administrar
 * invitados/activos/suspendidos (user:read/edit/delete). Nunca hard delete:
 * "Suspender" hace soft delete (status=disabled) y se puede reactivar.
 */
export function UsersAdmin() {
  const [showInvite, setShowInvite] = useState(false);

  return (
    <div>
      <RequireCapability cap="user:invite">
        <div className="flex justify-end">
          <Button type="button" onClick={() => setShowInvite((v) => !v)}>
            {showInvite ? "Cerrar" : "Invitar usuario"}
          </Button>
        </div>
      </RequireCapability>

      <RequireCapability cap="user:invite">
        {showInvite && (
          <section className="mt-4 rounded-xl border border-border bg-surface-muted p-4">
            <h2 className="text-lg font-semibold text-etext">Invitar usuario</h2>
            <p className="mt-1 text-sm text-etext-muted">
              Se envía una invitación por email. Quien la acepte creará su contraseña y entrará con
              el rol asignado.
            </p>
            <InviteForm />
          </section>
        )}
      </RequireCapability>

      <RequireCapability
        cap="user:read"
        fallback={
          <p className="mt-4 text-sm text-crisis">No tienes permiso para ver usuarios (user:read).</p>
        }
      >
        <UsersTable />
      </RequireCapability>
    </div>
  );
}
