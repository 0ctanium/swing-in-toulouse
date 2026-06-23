import "server-only";

import {
  getAdminAccessScope,
} from "@/lib/admin/access";
import type { EventsQueryEditKey } from "@/lib/admin/events-query-edit-key.types";
import { resolveAdminDataScope } from "@/lib/admin/data-scope";

export type { EventsQueryEditKey } from "@/lib/admin/events-query-edit-key.types";

export async function getEventsQueryEditKey(): Promise<
  Exclude<EventsQueryEditKey, "loading">
> {
  const scope = await getAdminAccessScope();

  if (!scope?.userId) {
    return "none";
  }

  const dataScope = resolveAdminDataScope(scope);

  if (dataScope.mode === "none") {
    return "none";
  }

  if (dataScope.mode === "all") {
    return "all";
  }

  if (!scope.clerkOrganizationId) {
    return "none";
  }

  return `org:${scope.clerkOrganizationId}`;
}
