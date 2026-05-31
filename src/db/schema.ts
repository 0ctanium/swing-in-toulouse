import { relations, sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

import type { IcalStoredData } from "@/lib/ical/types";
import type { EventOverridePatch } from "@/lib/events/overrides.types";
import type { OrganizationDance } from "@/lib/organizations/dances";
import type { OrganizationSocialLinks } from "@/lib/organizations/social-links";

export const eventStatusEnum = pgEnum("event_status", [
  "published",
  "cancelled",
]);

export const syncStatusEnum = pgEnum("sync_status", [
  "success",
  "partial",
  "failed",
]);

export const sourceTypeEnum = pgEnum("source_type", ["ical"]);

export const organizationCategoryEnum = pgEnum("organization_category", [
  "school",
  "association",
]);

export const venueCategoryEnum = pgEnum("venue_category", [
  "school",
  "bar",
  "hall",
  "exterior",
  "association",
  "other",
]);

export const eventCategoryTagTypeEnum = pgEnum("event_category_tag_type", [
  "danse",
  "evenement",
  "autre",
]);

export const venues = pgTable(
  "venues",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    address: text("address"),
    city: text("city").notNull().default("Toulouse"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    googlePlaceId: text("google_place_id"),
    formattedAddress: text("formatted_address"),
    addressConfirmedAt: timestamp("address_confirmed_at", {
      withTimezone: true,
    }),
    canonicalVenueId: uuid("canonical_venue_id").references(
      (): AnyPgColumn => venues.id,
      { onDelete: "restrict" },
    ),
    category: venueCategoryEnum("category"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("venues_slug_idx").on(table.slug),
    index("venues_canonical_venue_id_idx").on(table.canonicalVenueId),
  ],
);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    website: text("website"),
    venueId: uuid("venue_id").references(() => venues.id, {
      onDelete: "set null",
    }),
    category: organizationCategoryEnum("category"),
    dances: text("dances").array().$type<OrganizationDance[]>(),
    socialLinks: jsonb("social_links").$type<OrganizationSocialLinks>(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("organizations_slug_idx").on(table.slug),
    index("organizations_active_idx").on(table.isActive),
    index("organizations_venue_id_idx").on(table.venueId),
  ],
);

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    type: sourceTypeEnum("type").notNull().default("ical"),
    url: text("url").notNull(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    defaultLocationRaw: text("default_location_raw"),
    defaultCategories: text("default_categories").array(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("sources_slug_idx").on(table.slug),
    index("sources_active_idx").on(table.isActive),
    index("sources_organization_id_idx").on(table.organizationId),
  ],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    venueId: uuid("venue_id").references(() => venues.id, {
      onDelete: "set null",
    }),
    uid: text("uid").notNull(),
    sourceUid: text("source_uid"),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }),
    isAllDay: boolean("is_all_day").notNull().default(false),
    locationRaw: text("location_raw"),
    url: text("url"),
    sourceUrl: text("source_url"),
    icalData: jsonb("ical_data").$type<IcalStoredData>(),
    status: eventStatusEnum("status").notNull().default("published"),
    recurrenceRule: text("recurrence_rule"),
    categories: text("categories").array(),
    sequence: integer("sequence").notNull().default(0),
    lastModified: timestamp("last_modified", { withTimezone: true })
      .notNull()
      .defaultNow(),
    syncedAt: timestamp("synced_at", { withTimezone: true }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    canonicalEventId: uuid("canonical_event_id").references(
      (): AnyPgColumn => events.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("events_uid_idx").on(table.uid),
    uniqueIndex("events_source_source_uid_idx").on(
      table.sourceId,
      table.sourceUid,
    ),
    index("events_start_at_idx").on(table.startAt),
    index("events_status_idx").on(table.status),
    index("events_source_id_idx").on(table.sourceId),
    index("events_organization_id_idx").on(table.organizationId),
    index("events_venue_id_idx").on(table.venueId),
    index("events_canonical_event_id_idx").on(table.canonicalEventId),
  ],
);

export const eventOverrides = pgTable(
  "event_overrides",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    occurrenceStartAt: timestamp("occurrence_start_at", {
      withTimezone: true,
    }),
    patch: jsonb("patch").$type<EventOverridePatch>().notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("event_overrides_event_id_idx").on(table.eventId),
    uniqueIndex("event_overrides_master_unique_idx")
      .on(table.eventId)
      .where(sql`${table.occurrenceStartAt} is null`),
    uniqueIndex("event_overrides_occurrence_unique_idx").on(
      table.eventId,
      table.occurrenceStartAt,
    ),
  ],
);

export const eventCategoryTags = pgTable(
  "event_category_tags",
  {
    name: text("name").primaryKey(),
    tagType: eventCategoryTagTypeEnum("tag_type").notNull().default("autre"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("event_category_tags_type_idx").on(table.tagType)],
);

export const syncLogs = pgTable(
  "sync_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceId: uuid("source_id").references(() => sources.id, {
      onDelete: "set null",
    }),
    status: syncStatusEnum("status").notNull(),
    message: text("message"),
    eventsCreated: integer("events_created").notNull().default(0),
    eventsUpdated: integer("events_updated").notNull().default(0),
    eventsCancelled: integer("events_cancelled").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("sync_logs_created_at_idx").on(table.createdAt)],
);

export const venuesRelations = relations(venues, ({ many, one }) => ({
  events: many(events),
  canonicalVenue: one(venues, {
    fields: [venues.canonicalVenueId],
    references: [venues.id],
    relationName: "venueAliases",
  }),
  aliasVenues: many(venues, { relationName: "venueAliases" }),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  venue: one(venues, {
    fields: [organizations.venueId],
    references: [venues.id],
  }),
  sources: many(sources),
  events: many(events),
}));

export const sourcesRelations = relations(sources, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [sources.organizationId],
    references: [organizations.id],
  }),
  events: many(events),
  syncLogs: many(syncLogs),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  source: one(sources, {
    fields: [events.sourceId],
    references: [sources.id],
  }),
  organization: one(organizations, {
    fields: [events.organizationId],
    references: [organizations.id],
  }),
  venue: one(venues, {
    fields: [events.venueId],
    references: [venues.id],
  }),
  canonicalEvent: one(events, {
    fields: [events.canonicalEventId],
    references: [events.id],
    relationName: "eventDuplicates",
  }),
  duplicateEvents: many(events, { relationName: "eventDuplicates" }),
  overrides: many(eventOverrides),
}));

export const eventOverridesRelations = relations(eventOverrides, ({ one }) => ({
  event: one(events, {
    fields: [eventOverrides.eventId],
    references: [events.id],
  }),
}));

export const syncLogsRelations = relations(syncLogs, ({ one }) => ({
  source: one(sources, {
    fields: [syncLogs.sourceId],
    references: [sources.id],
  }),
}));

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type OrganizationCategory =
  (typeof organizationCategoryEnum.enumValues)[number];
export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
export type Venue = typeof venues.$inferSelect;
export type NewVenue = typeof venues.$inferInsert;
export type VenueCategory = (typeof venueCategoryEnum.enumValues)[number];
export type EventCategoryTag = typeof eventCategoryTags.$inferSelect;
export type NewEventCategoryTag = typeof eventCategoryTags.$inferInsert;
export type EventCategoryTagType =
  (typeof eventCategoryTagTypeEnum.enumValues)[number];
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventOverride = typeof eventOverrides.$inferSelect;
export type NewEventOverride = typeof eventOverrides.$inferInsert;
export type SyncLog = typeof syncLogs.$inferSelect;

export type SourceWithOrganization = Source & {
  organization: Organization | null;
};

export type EventMaster = Event & {
  source: Source;
  organization: Organization | null;
  venue: Venue | null;
};
