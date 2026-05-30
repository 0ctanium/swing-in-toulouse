import { and, eq, gte, isNull, lte, ne } from "drizzle-orm";

import { db } from "@/db";
import { events } from "@/db/schema";
import type { EventMaster } from "@/db/schema";

const CANDIDATE_WINDOW_MS = 60 * 60 * 1000;

export class DuplicateLinkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateLinkError";
  }
}

async function fetchEventMaster(eventId: string) {
  return db.query.events.findFirst({
    where: eq(events.id, eventId),
    with: {
      source: true,
      organization: true,
      venue: true,
    },
  }) as Promise<EventMaster | undefined>;
}

export async function resolveRootCanonicalEventId(eventId: string) {
  let currentId = eventId;

  for (let depth = 0; depth < 8; depth += 1) {
    const row = await db.query.events.findFirst({
      where: eq(events.id, currentId),
      columns: { id: true, canonicalEventId: true },
    });

    if (!row?.canonicalEventId) {
      return currentId;
    }

    currentId = row.canonicalEventId;
  }

  throw new DuplicateLinkError("Chaîne de doublons trop profonde.");
}

export async function getDuplicateLinkInfo(eventId: string) {
  const event = await fetchEventMaster(eventId);

  if (!event) {
    return null;
  }

  const [canonicalEvent, linkedDuplicates] = await Promise.all([
    event.canonicalEventId
      ? fetchEventMaster(event.canonicalEventId)
      : Promise.resolve(null),
    db.query.events.findMany({
      where: eq(events.canonicalEventId, eventId),
      with: {
        source: true,
        organization: true,
        venue: true,
      },
      orderBy: (table, { asc }) => [asc(table.startAt)],
    }) as Promise<EventMaster[]>,
  ]);

  return {
    event,
    canonicalEvent,
    linkedDuplicates,
  };
}

export async function findDuplicateCandidates(eventId: string, limit = 12) {
  const event = await fetchEventMaster(eventId);

  if (!event || event.canonicalEventId) {
    return [];
  }

  const startMin = new Date(event.startAt.getTime() - CANDIDATE_WINDOW_MS);
  const startMax = new Date(event.startAt.getTime() + CANDIDATE_WINDOW_MS);

  const candidates = (await db.query.events.findMany({
    where: and(
      ne(events.id, eventId),
      ne(events.sourceId, event.sourceId),
      isNull(events.canonicalEventId),
      eq(events.status, "published"),
      gte(events.startAt, startMin),
      lte(events.startAt, startMax),
    ),
    with: {
      source: true,
      organization: true,
      venue: true,
    },
    orderBy: (table, { asc }) => [asc(table.startAt)],
    limit: limit * 2,
  })) as EventMaster[];

  const normalizedTitle = normalizeTitle(event.title);

  return candidates
    .filter((candidate) => {
      const candidateTitle = normalizeTitle(candidate.title);
      return (
        candidateTitle === normalizedTitle ||
        candidateTitle.includes(normalizedTitle) ||
        normalizedTitle.includes(candidateTitle)
      );
    })
    .slice(0, limit);
}

export async function linkDuplicateEvent(
  duplicateEventId: string,
  canonicalEventId: string,
) {
  if (duplicateEventId === canonicalEventId) {
    throw new DuplicateLinkError("Un événement ne peut pas être fusionné avec lui-même.");
  }

  const [duplicate, canonical] = await Promise.all([
    fetchEventMaster(duplicateEventId),
    fetchEventMaster(canonicalEventId),
  ]);

  if (!duplicate || !canonical) {
    throw new DuplicateLinkError("Événement introuvable.");
  }

  if (duplicate.canonicalEventId) {
    throw new DuplicateLinkError("Cet événement est déjà lié à un doublon.");
  }

  if (canonical.canonicalEventId) {
    throw new DuplicateLinkError(
      "L'événement cible est lui-même un doublon. Liez vers l'événement principal.",
    );
  }

  const rootCanonicalId = await resolveRootCanonicalEventId(canonicalEventId);

  const [updated] = await db
    .update(events)
    .set({ canonicalEventId: rootCanonicalId })
    .where(eq(events.id, duplicateEventId))
    .returning();

  return updated;
}

export async function unlinkDuplicateEvent(eventId: string) {
  const [updated] = await db
    .update(events)
    .set({ canonicalEventId: null })
    .where(eq(events.id, eventId))
    .returning();

  if (!updated) {
    throw new DuplicateLinkError("Événement introuvable.");
  }

  return updated;
}

function normalizeTitle(title: string) {
  return title
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
