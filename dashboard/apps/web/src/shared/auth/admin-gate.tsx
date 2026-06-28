"use client";

import { useState, type ReactNode } from "react";
import { useAdminSessionContext } from "./admin-session-context";
import { LoginForm } from "./login-form";

interface AdminGateProps {
  children: ReactNode;
}

/**
 * Pure conditional: shows LoginForm when unauthenticated, children when authenticated.
 * Session state lives in AdminSessionProvider (ancestor); this component only reads it.
 */
export function AdminGate({ children }: AdminGateProps) {
  const { token, login } = useAdminSessionContext();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (token) {
    return <>{children}</>;
  }

  async function handleLogin(password: string) {
    setError(null);
    setPending(true);
    try {
      await login(password);
    } catch {
      setError("Credenciales inválidas. Inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return <LoginForm onSubmit={handleLogin} error={error} pending={pending} />;
}
