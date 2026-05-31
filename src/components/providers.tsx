"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState } from "react";

import { AdminModeProvider } from "@/components/admin/admin-mode-provider";
import { CalendarSubscribeDialogRoot } from "@/components/calendar/calendar-subscribe-dialog-root";
import { Toaster } from "@/components/ui/sonner";

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
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <AdminModeProvider isAdminMode={isAdminMode}>
          {children}
          <CalendarSubscribeDialogRoot />
          <Toaster richColors closeButton position="top-center" />
        </AdminModeProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  );
}
