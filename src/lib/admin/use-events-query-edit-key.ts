"use client";

import { useAuth } from "@clerk/nextjs";

import type { EventsQueryEditKey } from "@/lib/admin/events-query-edit-key.types";

export function useEventsQueryEditKey(): EventsQueryEditKey {
  const { isLoaded, userId, orgId, sessionClaims } = useAuth();

  if (!isLoaded) {
    return "loading";
  }

  if (!userId) {
    return "none";
  }

  if (orgId) {
    return `org:${orgId}`;
  }

  if (sessionClaims?.metadata?.role === "admin") {
    return "all";
  }

  return "none";
}
