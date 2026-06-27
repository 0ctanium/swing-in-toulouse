import { eq } from "drizzle-orm";

import { db } from "@/db";
import { events } from "@/db/schema";

export async function resolveUniqueEventSlug(baseSlug: string, uid: string) {
  const conflicting = await db.query.events.findFirst({
    where: eq(events.slug, baseSlug),
  });

  if (!conflicting || conflicting.uid === uid) {
    return baseSlug;
  }

  const suffix = uid.replace(/[@.]/g, "-").slice(0, 12);
  return `${baseSlug}-${suffix}`;
}
