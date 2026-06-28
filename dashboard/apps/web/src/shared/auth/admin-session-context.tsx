"use client";

import { createContext, useContext } from "react";

export interface AdminSessionContextValue {
  token: string | null;
  login: (password: string) => Promise<void>;
  logout: () => void;
}

export const AdminSessionContext = createContext<AdminSessionContextValue | null>(null);

export function useAdminSessionContext(): AdminSessionContextValue {
  const ctx = useContext(AdminSessionContext);
  if (ctx === null) {
    throw new Error("useAdminSessionContext must be used inside AdminSessionProvider");
  }
  return ctx;
}
