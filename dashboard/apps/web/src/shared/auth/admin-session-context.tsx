"use client";

import { createContext, useContext } from "react";

export interface AdminSessionContextValue {
  token: string | null;
  logout: () => void;
}

export const AdminSessionContext = createContext<AdminSessionContextValue | null>(null);

export function useAdminSessionContext(): AdminSessionContextValue {
  const ctx = useContext(AdminSessionContext);
  if (ctx === null) {
    throw new Error("useAdminSessionContext must be used inside AdminGate");
  }
  return ctx;
}
