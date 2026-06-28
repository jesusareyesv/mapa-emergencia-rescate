"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

/**
 * Client-side providers: TanStack Query.
 * useState with a lazy initializer creates one QueryClient per component
 * mount (not per render) without needing a ref.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState<QueryClient>(makeQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
