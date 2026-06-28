"use client";

import { useState, useCallback } from "react";

const TOKEN_KEY = "dashboard:adminToken";

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export interface AdminSession {
  token: string | null;
  login(password: string): Promise<void>;
  logout(): void;
}

export function useAdminSession(): AdminSession {
  const [token, setToken] = useState<string | null>(() => readToken());

  const login = useCallback(async (password: string): Promise<void> => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      throw new Error("Invalid credentials");
    }

    // Passthrough scheme: token === password
    sessionStorage.setItem(TOKEN_KEY, password);
    setToken(password);
  }, []);

  const logout = useCallback((): void => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }, []);

  return { token, login, logout };
}
