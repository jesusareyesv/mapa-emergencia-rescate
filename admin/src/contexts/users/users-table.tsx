"use client";

import { useMemo, useState } from "react";
import { Button } from "@/src/ui";
import { useAdminSessionContext } from "../../shared/auth/admin-session-context";
import { useRoles } from "../roles/use-roles";
import { useUsers, useUpdateUser, useSuspendUser, type User, type UserStatus } from "./use-users";

const STATUS_LABEL: Record<UserStatus, string> = {
  invited: "Invitado",
  active: "Activo",
  disabled: "Suspendido",
};

const STATUS_STYLE: Record<UserStatus, string> = {
  invited: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
  disabled: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700",
};

function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

// Iconos
const PauseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const FILTERS: Array<{ key: "all" | UserStatus; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Activos" },
  { key: "invited", label: "Invitados" },
  { key: "disabled", label: "Suspendidos" },
];

/** Tabla de gestión de usuarios estilo Apple */
export function UsersTable() {
  const { data: users, isLoading, isError } = useUsers();
  const { data: roles } = useRoles();
  const { user: me, can } = useAdminSessionContext();
  const updateUser = useUpdateUser();
  const suspendUser = useSuspendUser();

  const [filter, setFilter] = useState<"all" | UserStatus>("all");
  const canEdit = can("user:edit");
  const canDelete = can("user:delete");
  const showActions = canEdit || canDelete;

  const roleName = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of roles ?? []) m.set(r.id, r.name);
    return m;
  }, [roles]);

  const rows = useMemo(
    () => (users ?? []).filter((u) => filter === "all" || u.status === filter),
    [users, filter],
  );

  if (isLoading) {
    return (
      <div className="mt-8 flex justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-navy border-t-transparent" />
      </div>
    );
  }

  if (isError) return <p className="mt-4 text-sm text-crisis">No se pudieron cargar los usuarios.</p>;

  async function changeRole(u: User, roleId: string) {
    try {
      await updateUser.mutateAsync({ id: u.id, input: { roleId: roleId || null } });
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo cambiar el rol.");
    }
  }

  async function suspend(u: User) {
    if (!confirm(`¿Suspender a ${u.email}? Podrás reactivarlo después (no se elimina).`)) return;
    try {
      await suspendUser.mutateAsync(u.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo suspender.");
    }
  }

  async function reactivate(u: User) {
    try {
      await updateUser.mutateAsync({ id: u.id, input: { status: "active" } });
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo reactivar.");
    }
  }

  return (
    <div className="mt-4">
      {/* Segmented Control */}
      <div className="mb-4 inline-flex p-1 bg-surface-muted border border-border rounded-xl">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
              filter === f.key
                ? "bg-surface shadow-sm text-etext"
                : "text-etext-muted hover:text-etext"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-all">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted/50 text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-etext-muted">Email</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-etext-muted">Nombre</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-etext-muted">Rol</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-etext-muted">Estado</th>
                {showActions && <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-etext-muted text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((u) => {
                const isSelf = u.id === me?.id;
                return (
                  <tr key={u.id} className="group transition-colors hover:bg-surface-muted/30">
                    <td className="px-5 py-4 font-medium text-etext">
                      {u.email} {isSelf && <span className="ml-2 text-xs text-etext-muted font-normal italic">(tú)</span>}
                    </td>
                    <td className="px-5 py-4 text-etext-muted">{u.name || <span className="text-gray-400 italic">Sin nombre</span>}</td>
                    <td className="px-5 py-4">
                      {canEdit && !isSelf ? (
                        <select
                          value={u.roleId ?? ""}
                          onChange={(e) => changeRole(u, e.target.value)}
                          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-etext focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy transition-colors cursor-pointer"
                        >
                          <option value="">— Sin rol —</option>
                          {(roles ?? []).map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-etext-muted">{(u.roleId && roleName.get(u.roleId)) || "—"}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={u.status} />
                    </td>
                    {showActions && (
                      <td className="px-5 py-4 text-right">
                        {isSelf ? (
                          <span className="text-xs text-etext-muted opacity-0 group-hover:opacity-100 transition-opacity">Protegido</span>
                        ) : (
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {u.status === "disabled"
                              ? canEdit && (
                                  <button
                                    type="button"
                                    title="Reactivar usuario"
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-green-600 hover:bg-green-100 transition-colors"
                                    disabled={updateUser.isPending}
                                    onClick={() => reactivate(u)}
                                  >
                                    <PlayIcon />
                                  </button>
                                )
                              : canDelete && (
                                  <button
                                    type="button"
                                    title="Suspender usuario"
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-amber-600 hover:bg-amber-100 transition-colors"
                                    disabled={suspendUser.isPending}
                                    onClick={() => suspend(u)}
                                  >
                                    <PauseIcon />
                                  </button>
                                )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={showActions ? 5 : 4} className="px-5 py-8 text-center text-etext-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <p>Sin usuarios en este filtro.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
