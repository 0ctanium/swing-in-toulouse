export type EventStatus = "confirmed" | "cancelled";

export type NormalizedOrganizer = {
  name: string;
  email?: string;
};

export type IcalStoredData = {
  dtstamp?: string;
  created?: string;
  datetype?: "date" | "date-time";
  method?: string;
  icalStatus?: "TENTATIVE" | "CONFIRMED" | "CANCELLED";
  transparency?: "OPAQUE" | "TRANSPARENT";
  class?: "PUBLIC" | "PRIVATE" | "CONFIDENTIAL";
  geo?: { lat: number; lon: number };
  organizer?: NormalizedOrganizer;
  attendees?: Array<{
    name?: string;
    email?: string;
    role?: string;
    partstat?: string;
    rsvp?: string;
  }>;
  recurrenceId?: string;
  alarms?: Array<{
    action: string;
    trigger: string;
    description?: string;
    summary?: string;
    repeat?: number;
  }>;
  recurrences?: Record<string, unknown>;
};

export type NormalizedEvent = {
  uid: string;
  title: string;
  description?: string;
  startAt: Date;
  endAt?: Date;
  isAllDay: boolean;
  location?: string;
  structuredLocation?: {
    title: string;
    geo: { lat: number; lon: number };
  };
  geo?: { lat: number; lon: number };
  url?: string;
  sourceUrl?: string;
  status: EventStatus;
  categories?: string[];
  organizer?: NormalizedOrganizer;
  sequence: number;
  lastModified: Date;
  recurrenceRule?: string;
  recurrenceId?: Date;
  icalData?: IcalStoredData;
};

export type CalendarFeedMeta = {
  name: string;
  description?: string;
  prodId: string;
  timezone?: string;
};

export type ParsedCalendar = {
  events: NormalizedEvent[];
};
