"use client";

import type { ReactNode } from "react";
import { useAdminSession } from "./use-admin-session";
import { AdminSessionContext } from "./admin-session-context";

interface AdminSessionProviderProps {
  children: ReactNode;
}

/**
 * Owns the session state (via useAdminSession) and provides
 * token + logout to children through AdminSessionContext.
 *
 * Renders nothing visible — pure context provider.
 */
export function AdminSessionProvider({ children }: AdminSessionProviderProps) {
  const { token, login, logout } = useAdminSession();

  return (
    <AdminSessionContext.Provider value={{ token, login, logout }}>
      {children}
    </AdminSessionContext.Provider>
  );
}
