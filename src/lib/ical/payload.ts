import { z } from "zod";

import {
  type AgendaFilters,
  hasActiveAgendaFilters,
} from "@/lib/events/agenda-filters";

const icalPayloadSchema = z.object({
  category: z.array(z.string()).optional(),
  venue: z.array(z.string()).optional(),
  org: z.array(z.string()).optional(),
  event: z.array(z.string()).optional(),
});

export type IcalPayload = AgendaFilters & {
  event: string[];
};

/** Stable segment for the global (unfiltered) feed. */
export const GLOBAL_ICAL_PAYLOAD = "e30=";

export class IcalPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IcalPayloadError";
  }
}

function normalizeFilters(raw: z.infer<typeof icalPayloadSchema>): IcalPayload {
  return {
    category: raw.category ?? [],
    venue: raw.venue ?? [],
    org: raw.org ?? [],
    event: raw.event ?? [],
  };
}

function toBase64Url(json: string): string {
  return Buffer.from(json, "utf8").toString("base64url");
}

function fromBase64Url(encoded: string): string {
  return Buffer.from(encoded, "base64url").toString("utf8");
}

export function emptyIcalPayload(): IcalPayload {
  return { category: [], venue: [], org: [], event: [] };
}

export function hasActiveIcalPayload(filters: IcalPayload) {
  return hasActiveAgendaFilters(filters) || filters.event.length > 0;
}

export function encodeIcalPayload(filters: IcalPayload): string {
  const payload = {
    ...(filters.category.length > 0
      ? { category: filters.category.sort() }
      : {}),
    ...(filters.venue.length > 0 ? { venue: filters.venue.sort() } : {}),
    ...(filters.org.length > 0 ? { org: filters.org.sort() } : {}),
    ...(filters.event.length > 0 ? { event: filters.event.sort() } : {}),
  };

  if (Object.keys(payload).length === 0) {
    return GLOBAL_ICAL_PAYLOAD;
  }

  return toBase64Url(JSON.stringify(payload));
}

export function decodeIcalPayload(encoded: string): IcalPayload {
  const trimmed = encoded.trim();

  if (!trimmed || trimmed === GLOBAL_ICAL_PAYLOAD) {
    return emptyIcalPayload();
  }

  let json: string;

  try {
    json = fromBase64Url(trimmed);
  } catch {
    throw new IcalPayloadError("Invalid iCal payload encoding.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch {
    throw new IcalPayloadError("Invalid iCal payload JSON.");
  }

  const result = icalPayloadSchema.safeParse(parsed);

  if (!result.success) {
    throw new IcalPayloadError("Invalid iCal payload shape.");
  }

  return normalizeFilters(result.data);
}

export function buildIcalFeedPath(filters: IcalPayload): string {
  return `/api/ical/${encodeIcalPayload(filters)}.ics`;
}

export function describeIcalPayload(filters: IcalPayload): {
  isFiltered: boolean;
} {
  return { isFiltered: hasActiveIcalPayload(filters) };
}
