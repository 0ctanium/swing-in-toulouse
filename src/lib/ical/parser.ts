import type { NormalizedEvent } from "./types";
import { mapVEventToNormalized } from "./extract";

type NodeIcalModule = typeof import("node-ical");

async function loadNodeIcal(): Promise<NodeIcalModule> {
  const mod = await import("node-ical");

  if ("sync" in mod && mod.sync) {
    return mod;
  }

  if (
    "default" in mod &&
    mod.default &&
    typeof mod.default === "object" &&
    "sync" in mod.default
  ) {
    return mod.default as NodeIcalModule;
  }

  throw new Error("Unable to load node-ical parser");
}

export async function parseIcalContent(content: string): Promise<NormalizedEvent[]> {
  const ical = await loadNodeIcal();
  const parsed = ical.sync.parseICS(content);
  const events: NormalizedEvent[] = [];

  for (const item of Object.values(parsed)) {
    if (!item || item.type !== "VEVENT") {
      continue;
    }

    const normalized = mapVEventToNormalized(item);
    if (normalized) {
      events.push(normalized);
    }
  }

  return events;
}

export async function fetchAndParseIcalFeed(calendarUrl: string) {
  const response = await fetch(calendarUrl, {
    headers: {
      Accept: "text/calendar,text/plain,*/*",
      "User-Agent": "SwingToulouse/1.0 (calendar-sync)",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch calendar (${response.status} ${response.statusText})`,
    );
  }

  const content = await response.text();
  return parseIcalContent(content);
}

export { mapVEventToNormalized } from "./extract";
