"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { AdminModeProvider } from "@/components/admin/admin-mode-provider";

export function Providers({
  children,
  isAdminMode = false,
}: {
  children: React.ReactNode;
  isAdminMode?: boolean;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AdminModeProvider isAdminMode={isAdminMode}>{children}</AdminModeProvider>
    </QueryClientProvider>
  );
}
