"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState } from "react";

import { CalendarSubscribeDialogRoot } from "@/components/calendar/calendar-subscribe-dialog-root";
import { Toaster } from "@/components/ui/sonner";
import { getQueryClient } from "@/lib/query/get-query-client";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => getQueryClient());

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
