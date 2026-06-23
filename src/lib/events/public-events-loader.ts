import "server-only";

import { endOfDay, startOfDay } from "date-fns";

import {
  buildAdminMetaForOccurrences,
  type AdminEventMeta,
} from "@/lib/events/admin-meta";
import { getUpcomingEvents } from "@/lib/events/queries";
import { loadOverridesForEvents } from "@/lib/events/overrides";
import {
  serializeOccurrence,
  type SerializableEventOccurrence,
} from "@/lib/events/serialize";
import { getAdminDataScopeOrNull } from "@/lib/admin/access";
import { isEventInInlineEditScope } from "@/lib/admin/auth";

export async function loadPublicEventsForRange(
  from: Date,
  to: Date,
  limit?: number,
): Promise<SerializableEventOccurrence[]> {
  const events = await getUpcomingEvents({
    from: startOfDay(from),
    to: endOfDay(to),
    limit,
  });

  const dataScope = await getAdminDataScopeOrNull();
  let adminMetaByOccurrenceId: Map<string, AdminEventMeta> | null = null;

  if (dataScope && events.length > 0) {
    const editableEvents = events.filter((event) =>
      isEventInInlineEditScope(dataScope, event.organization?.id),
    );

    if (editableEvents.length > 0) {
      const masterIds = [
        ...new Set(editableEvents.map((event) => event.masterEventId)),
      ];
      const overrides = await loadOverridesForEvents(masterIds);
      adminMetaByOccurrenceId = buildAdminMetaForOccurrences(
        editableEvents,
        overrides,
      );
    }
  }

  return events.map((event) => ({
    ...serializeOccurrence(event),
    ...(adminMetaByOccurrenceId?.get(event.id)
      ? { admin: adminMetaByOccurrenceId.get(event.id) }
      : {}),
  }));
}
