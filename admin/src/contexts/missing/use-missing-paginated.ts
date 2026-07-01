"use client";

import { useQuery } from "@tanstack/react-query";
import type { MissingDTO } from "./missing-grid";

export interface MissingListResponse {
  people: MissingDTO[];
  total: number;
  totalCapped: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  persistent: boolean;
}

export interface MissingListParams {
  status: "active" | "found" | "all";
  page: number;
  pageSize: number;
  q?: string;
}

async function fetchMissingPage(params: MissingListParams): Promise<MissingListResponse> {
  const sp = new URLSearchParams({
    status: params.status,
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.q && params.q.length >= 3) {
    sp.set("q", params.q);
  }
  sp.set("_t", Date.now().toString());

  const res = await fetch(`/api/missing?${sp.toString()}`, { 
    credentials: "same-origin",
    cache: "no-store" 
  });
  if (!res.ok) {
    throw new Error(`Error loading missing people (${res.status})`);
  }
  return (await res.json()) as MissingListResponse;
}

export function useMissingPaginated(params: MissingListParams) {
  return useQuery({
    queryKey: ["missing", "paginated", params],
    queryFn: () => fetchMissingPage(params),
    refetchInterval: 30_000,
    placeholderData: (prev) => prev,
  });
}
