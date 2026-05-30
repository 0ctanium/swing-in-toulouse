import type { IcalStoredData } from "./types";

const VOLATILE_ICAL_DATA_KEYS = new Set(["dtstamp", "method", "recurrences"]);

function stableIcalDataSnapshot(data: IcalStoredData | null | undefined) {
  if (!data) {
    return null;
  }

  const entries = Object.entries(data)
    .filter(([key]) => !VOLATILE_ICAL_DATA_KEYS.has(key))
    .sort(([left], [right]) => left.localeCompare(right));

  return Object.fromEntries(entries);
}

export function hasIcalDataChanges(
  existing: IcalStoredData | null | undefined,
  next: IcalStoredData | null | undefined,
) {
  return (
    JSON.stringify(stableIcalDataSnapshot(existing)) !==
    JSON.stringify(stableIcalDataSnapshot(next))
  );
}

export function hasIcalRevisionChanges(
  existing: Pick<{ sequence: number; lastModified: Date }, "sequence" | "lastModified">,
  next: Pick<{ sequence: number; lastModified: Date }, "sequence" | "lastModified">,
) {
  return (
    existing.sequence !== next.sequence ||
    existing.lastModified.getTime() !== next.lastModified.getTime()
  );
}
