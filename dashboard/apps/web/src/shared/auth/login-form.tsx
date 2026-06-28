"use client";

import { useState, type FormEvent } from "react";
import { Input, Button } from "@repo/ui";

export interface LoginFormProps {
  onSubmit: (password: string) => Promise<void>;
  error?: string | null;
  pending?: boolean;
}

/**
 * Presentational login form built from @repo/ui atoms.
 * Owns local password state; delegates auth logic to onSubmit.
 */
export function LoginForm({ onSubmit, error, pending = false }: LoginFormProps) {
  const [password, setPassword] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSubmit(password);
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
