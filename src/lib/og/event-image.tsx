import { format } from "date-fns";
import { fr } from "date-fns/locale";

import type { EventOccurrence } from "@/lib/ical/recurrence";
import { formatIcalStatus } from "@/lib/events/display";
import {
  formatEventChipTime,
  formatEventScheduleTime,
  isAllDayEvent,
} from "@/lib/events/format";
import { loadOgAssets } from "@/lib/og/assets";
import { OgBadges, type OgBadge } from "@/lib/og/badges";
import { createOgImageResponse } from "@/lib/og/create-image-response";
import { ogPalette } from "@/lib/og/palette";
import {
  OgContentColumn,
  OgMetaLines,
  OgShell,
  OgSidebarCard,
} from "@/lib/og/shell";
import { truncate } from "@/lib/og/truncate";
import { siteConfig } from "@/lib/site";

type EventOgData = Pick<
  EventOccurrence,
  | "title"
  | "startAt"
  | "endAt"
  | "isAllDay"
  | "categories"
  | "organization"
  | "venue"
  | "status"
  | "icalData"
  | "locationRaw"
>;

function organizerLabel(event: EventOgData) {
  return event.organization?.name ?? null;
}

function locationLabel(event: EventOgData) {
  return event.venue?.name ?? event.locationRaw ?? null;
}

function eventBadges(event: EventOgData): OgBadge[] {
  const badges: OgBadge[] = [];

  if (event.status === "cancelled") {
    badges.push({ label: "Annulé", tone: "destructive" });
  }

  const tentativeLabel = formatIcalStatus(event.icalData?.icalStatus);
  if (tentativeLabel === "Provisoire") {
    badges.push({ label: "Provisoire", tone: "muted" });
  }

  for (const category of event.categories ?? []) {
    if (badges.length >= 4) {
      break;
    }

    if (!badges.some((badge) => badge.label === category)) {
      badges.push({ label: category, tone: "default" });
    }
  }

  return badges;
}

function EventOgLayout({
  event,
  assets,
}: {
  event: EventOgData;
  assets: Awaited<ReturnType<typeof loadOgAssets>>;
}) {
  const cancelled = event.status === "cancelled";
  const allDay = isAllDayEvent(event.startAt, event.endAt, event.isAllDay);
  const timeLabel = allDay
    ? "Jour entier"
    : formatEventChipTime(event.startAt, event.endAt, event.isAllDay);
  const scheduleLabel = formatEventScheduleTime(
    event.startAt,
    event.endAt,
    event.isAllDay,
  );
  const venue = locationLabel(event);
  const organizer = organizerLabel(event);
  const badges = eventBadges(event);

  const dayNumber = format(event.startAt, "d", { locale: fr });
  const monthLabel = format(event.startAt, "MMM", { locale: fr }).toUpperCase();
  const weekdayLabel = format(event.startAt, "EEE", { locale: fr })
    .replace(".", "")
    .toUpperCase();
  const fullDate = format(event.startAt, "EEEE d MMMM yyyy", { locale: fr });

  return (
    <OgShell assets={assets} pill="Événement">
      <div style={{ display: "flex", flex: 1, gap: 40, alignItems: "stretch" }}>
        <OgSidebarCard>
          <span
            style={{
              fontFamily: "Fraunces",
              fontSize: 88,
              fontWeight: 600,
              lineHeight: 1,
              color: ogPalette.primary,
            }}
          >
            {dayNumber}
          </span>
          <span
            style={{
              fontSize: 28,
              fontWeight: 500,
              letterSpacing: "0.12em",
              color: ogPalette.foreground,
              marginTop: 8,
            }}
          >
            {monthLabel}
          </span>
          <span
            style={{
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: "0.08em",
              color: ogPalette.muted,
              marginTop: 8,
            }}
          >
            {weekdayLabel}
          </span>
          {timeLabel ? (
            <span
              style={{
                fontSize: 24,
                fontWeight: 500,
                color: ogPalette.primary,
                marginTop: 16,
                padding: "6px 14px",
                borderRadius: 999,
                background: ogPalette.accent,
              }}
            >
              {timeLabel}
            </span>
          ) : null}
        </OgSidebarCard>

        <OgContentColumn>
          <h1
            style={{
              fontFamily: "Fraunces",
              fontSize: 52,
              fontWeight: 600,
              lineHeight: 1.15,
              margin: 0,
              color: cancelled ? ogPalette.muted : ogPalette.foreground,
              textDecoration: cancelled ? "line-through" : "none",
            }}
          >
            {truncate(event.title, 90)}
          </h1>

          <OgMetaLines>
            <span style={{ display: "flex", color: ogPalette.foreground }}>
              {fullDate}
              {!allDay && scheduleLabel ? ` · ${scheduleLabel}` : null}
            </span>
            {venue ? <span>Lieu · {truncate(venue, 60)}</span> : null}
            {organizer ? <span>Par · {truncate(organizer, 60)}</span> : null}
          </OgMetaLines>

          <OgBadges badges={badges} />
        </OgContentColumn>
      </div>
    </OgShell>
  );
}

function FallbackOgLayout({
  assets,
}: {
  assets: Awaited<ReturnType<typeof loadOgAssets>>;
}) {
  return (
    <OgShell assets={assets} pill="Événement">
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <h1
          style={{
            fontFamily: "Fraunces",
            fontSize: 56,
            fontWeight: 600,
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          Agenda swing à Toulouse
        </h1>
        <p
          style={{
            fontSize: 28,
            lineHeight: 1.4,
            color: ogPalette.muted,
            margin: 0,
            maxWidth: 900,
          }}
        >
          {siteConfig.description}
        </p>
      </div>
    </OgShell>
  );
}

export async function renderEventOgImage(event: EventOgData | null) {
  const assets = await loadOgAssets();

  return createOgImageResponse(
    event ? (
      <EventOgLayout event={event} assets={assets} />
    ) : (
      <FallbackOgLayout assets={assets} />
    ),
    assets,
  );
}
