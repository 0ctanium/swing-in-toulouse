"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState } from "react";

import { CalendarSubscribeDialogRoot } from "@/components/calendar/calendar-subscribe-dialog-root";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
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
        {children}
        <CalendarSubscribeDialogRoot />
        <Toaster richColors closeButton position="top-center" />
      </QueryClientProvider>
    </NuqsAdapter>
  );
}
