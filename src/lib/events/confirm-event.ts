import { eq } from "drizzle-orm";

import { db } from "@/db";
import { events } from "@/db/schema";
import { upsertEventOverride } from "@/lib/events/overrides";
import type { EventOverridePatch } from "@/lib/events/overrides.types";
import { hasMasterOverrideChanges } from "@/lib/events/override-patch";

export async function confirmEvent(
  eventId: string,
  patch: EventOverridePatch = {},
) {
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
    columns: { id: true },
  });

  if (!event) {
    return null;
  }

  if (hasMasterOverrideChanges(patch)) {
    await upsertEventOverride({
      eventId,
      patch,
    });
  }

  const [updated] = await db
    .update(events)
    .set({ confirmedAt: new Date() })
    .where(eq(events.id, eventId))
    .returning();

  return updated;
}
