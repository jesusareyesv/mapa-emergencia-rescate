"use client";

import { useQuery } from "@tanstack/react-query";
import type { Report } from "../domain/report";

async function fetchReports(token: string): Promise<Report[]> {
  const response = await fetch("/api/reports", {
    headers: { "x-admin-token": token },
  });

  if (!response.ok) {
    throw new Error(`BFF error: ${response.status}`);
  }

  return response.json() as Promise<Report[]>;
}

export function useReports(token: string) {
  return useQuery<Report[], Error>({
    queryKey: ["reports", token],
    queryFn: () => fetchReports(token),
    refetchInterval: 7000,
    refetchIntervalInBackground: false,
    enabled: Boolean(token),
  });
}
