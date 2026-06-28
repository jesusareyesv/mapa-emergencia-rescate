"use client";

import { useQuery } from "@tanstack/react-query";
import { ADMIN_TOKEN_HEADER } from "../../../shared/auth/admin-token";
import type { Report } from "../domain/report";

export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

const REPORTS_POLL_INTERVAL_MS = 7000;

async function fetchReports(token: string): Promise<Report[]> {
  const response = await fetch("/api/reports", {
    headers: { [ADMIN_TOKEN_HEADER]: token },
  });

  if (response.status === 401) {
    throw new UnauthorizedError();
  }

  if (!response.ok) {
    throw new Error(`BFF error: ${response.status}`);
  }

  return response.json() as Promise<Report[]>;
}

export function useReports(token: string) {
  return useQuery<Report[], Error>({
    queryKey: ["reports"],
    queryFn: () => fetchReports(token),
    refetchInterval: REPORTS_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    enabled: Boolean(token),
  });
}
