"use client";

import { useState } from "react";
import { Button } from "@/src/ui";
import { useAdminSessionContext } from "../../shared/auth/admin-session-context";
import { useRoles, useDeleteRole, type Role } from "./use-roles";
import { RoleEditForm } from "./role-edit-form";

// Iconos estilo Apple
const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/** Lista de roles con acciones (editar / eliminar) gateadas por capacidad. */
export function RolesList() {
  const { data: roles, isLoading, isError } = useRoles();
  const { can } = useAdminSessionContext();
  const deleteRole = useDeleteRole();
  const [editingId, setEditingId] = useState<string | null>(null);

  const canEdit = can("role:edit");
  const canDelete = can("role:delete");
  const showActions = canEdit || canDelete;

  if (isLoading) {
    return (
      <div className="mt-8 flex justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-navy border-t-transparent" />
      </div>
    );
  }

  if (isError) return <p className="mt-4 text-sm text-crisis">No se pudieron cargar los roles.</p>;

  async function onDelete(role: Role) {
    if (!confirm(`¿Eliminar el rol “${role.name}”? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteRole.mutateAsync(role.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo eliminar el rol.");
    }
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-muted/50 text-left">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-etext-muted">Nombre</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-etext-muted">Descripción</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-etext-muted">Capacidades</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-etext-muted">Sistema</th>
              {showActions && (
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-etext-muted text-right">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(roles ?? []).map((r) => (
              <tr key={r.id} className="group transition-colors hover:bg-surface-muted/30">
                <td className="px-5 py-4 font-medium text-etext">
                  {r.name}
                </td>
                <td className="px-5 py-4 text-etext-muted">
                  {r.description || <span className="text-gray-400 italic">Sin descripción</span>}
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center justify-center rounded-full bg-navy/10 px-2.5 py-0.5 text-xs font-semibold text-navy">
                    {r.capabilities.includes("*") ? "Todas (*)" : r.capabilities.length}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {r.isSystem ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                      <LockIcon /> Protegido
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                {showActions && (
                  <td className="px-5 py-4 text-right">
                    {r.isSystem ? (
                      <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Inmutable</span>
                    ) : (
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canEdit && (
                          <button
                            type="button"
                            title="Editar rol"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-etext-muted hover:bg-navy/10 hover:text-navy transition-colors"
                            onClick={() => setEditingId(r.id)}
                          >
                            <EditIcon />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            title="Eliminar rol"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-etext-muted hover:bg-crisis/10 hover:text-crisis transition-colors"
                            disabled={deleteRole.isPending}
                            onClick={() => onDelete(r)}
                          >
                            <TrashIcon />
                          </button>
                        )}
                      </div>
                    )}
                    {editingId === r.id && (
                      <RoleEditForm role={r} onDone={() => setEditingId(null)} />
                    )}
                  </td>
                )}
              </tr>
            ))}
            {(roles ?? []).length === 0 && (
              <tr>
                <td colSpan={showActions ? 5 : 4} className="px-5 py-8 text-center text-etext-muted">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <path d="M3 9h18" />
                    </svg>
                    <p>No se encontraron roles.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
