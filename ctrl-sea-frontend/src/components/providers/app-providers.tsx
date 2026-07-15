"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/lib/auth";
import { BackendStatusProvider } from "@/components/providers/backend-status-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1
      }
    }
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <BackendStatusProvider>
        <AuthProvider>{children}</AuthProvider>
      </BackendStatusProvider>
    </QueryClientProvider>
  );
}
