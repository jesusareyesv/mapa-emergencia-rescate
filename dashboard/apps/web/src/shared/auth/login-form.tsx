"use client";

import { useState, type FormEvent } from "react";
import { Input, Button } from "@repo/ui";

export interface LoginFormProps {
  /** Called with the typed password when the form is submitted. May throw on auth error. */
  onSubmit: (password: string) => Promise<void>;
}

/**
 * Login form built from @repo/ui atoms.
 * Owns password, pending, and error state; delegates auth logic to onSubmit.
 * An onSubmit rejection is caught and shown as a Spanish error message.
 */
export function LoginForm({ onSubmit }: LoginFormProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await onSubmit(password);
    } catch {
      setError("Credenciales inválidas. Inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4 w-full max-w-xs">
      <Input
        label="Contraseña"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
