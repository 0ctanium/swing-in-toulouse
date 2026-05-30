import type { Event } from "@/db/schema";

type ReviewedEventFields = Pick<
  Event,
  | "title"
  | "description"
  | "startAt"
  | "endAt"
  | "isAllDay"
  | "locationRaw"
  | "sourceUrl"
  | "venueId"
  | "organizationId"
  | "recurrenceRule"
  | "status"
  | "categories"
>;

export function isEventConfirmed(
  event: Pick<Event, "confirmedAt">,
): boolean {
  return event.confirmedAt != null;
}

function categoriesEqual(
  left: string[] | null | undefined,
  right: string[] | null | undefined,
) {
  return JSON.stringify(left ?? []) === JSON.stringify(right ?? []);
}

export function hasMaterialEventChanges(
  existing: ReviewedEventFields,
  next: ReviewedEventFields,
) {
  return (
    existing.title !== next.title ||
    existing.description !== next.description ||
    existing.startAt.getTime() !== next.startAt.getTime() ||
    (existing.endAt?.getTime() ?? null) !== (next.endAt?.getTime() ?? null) ||
    existing.isAllDay !== next.isAllDay ||
    existing.locationRaw !== next.locationRaw ||
    existing.sourceUrl !== next.sourceUrl ||
    existing.venueId !== next.venueId ||
    existing.organizationId !== next.organizationId ||
    existing.recurrenceRule !== next.recurrenceRule ||
    existing.status !== next.status ||
    !categoriesEqual(existing.categories, next.categories)
  );
}

export function shouldClearEventConfirmation(
  existing: ReviewedEventFields & Pick<Event, "confirmedAt">,
  next: ReviewedEventFields,
) {
  return (
    isEventConfirmed(existing) && hasMaterialEventChanges(existing, next)
  );
}
