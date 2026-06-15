"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useState } from "react";

import { CalendarSubscribeDialogRoot } from "@/components/calendar/calendar-subscribe-dialog-root";
import { Toaster } from "@/components/ui/sonner";
import { getQueryClient } from "@/lib/query/get-query-client";
import posthog from "posthog-js";
import { PostHogProvider } from "@posthog/react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => getQueryClient());

  return (
    <PostHogProvider client={posthog}>
      <NuqsAdapter>
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools initialIsOpen={false} />
          {children}
          <CalendarSubscribeDialogRoot />
          <Toaster richColors closeButton position="top-center" />
        </QueryClientProvider>
      </NuqsAdapter>
    </PostHogProvider>
  );
}
