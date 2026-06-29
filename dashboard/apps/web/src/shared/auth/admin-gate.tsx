"use client";

import { type ReactNode } from "react";
import { useAdminSessionContext } from "./admin-session-context";
import { LoginForm } from "./login-form";

interface AdminGateProps {
  children: ReactNode;
}

/**
 * Pure conditional: shows LoginForm when unauthenticated, children when authenticated.
 * Session state lives in AdminSessionProvider (ancestor); this component only reads it.
 * Error/pending state lives inside LoginForm.
 */
export function AdminGate({ children }: AdminGateProps) {
  const { token, login } = useAdminSessionContext();

  if (token) {
    return <>{children}</>;
  }

  return <LoginForm onSubmit={login} />;
}
