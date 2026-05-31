import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ImageResponse } from "next/og";
import type { ReactNode } from "react";

import type { EventOccurrence } from "@/lib/ical/recurrence";
import { formatIcalStatus } from "@/lib/events/display";
import {
  formatEventChipTime,
  formatEventScheduleTime,
  isAllDayEvent,
} from "@/lib/events/format";
import { loadOgAssets } from "@/lib/og/assets";
import { ogPalette, ogSize } from "@/lib/og/palette";
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
  | "source"
  | "venue"
  | "status"
  | "icalData"
  | "locationRaw"
>;

function organizerLabel(event: EventOgData) {
  return event.organization?.name ?? event.source.name;
}

function locationLabel(event: EventOgData) {
  return event.venue?.name ?? event.locationRaw ?? null;
}

function eventBadges(event: EventOgData) {
  const badges: Array<{ label: string; tone: "default" | "destructive" | "muted" }> =
    [];

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

function badgeColors(tone: "default" | "destructive" | "muted") {
  switch (tone) {
    case "destructive":
      return {
        background: ogPalette.destructive,
        color: ogPalette.destructiveForeground,
        border: ogPalette.destructive,
      };
    case "muted":
      return {
        background: ogPalette.card,
        color: ogPalette.muted,
        border: ogPalette.border,
      };
    default:
      return {
        background: ogPalette.accent,
        color: ogPalette.accentForeground,
        border: ogPalette.border,
      };
  }
}

function OgShell({
  assets,
  pill,
  children,
}: {
  assets: Awaited<ReturnType<typeof loadOgAssets>>;
  pill: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: ogPalette.background,
        color: ogPalette.foreground,
        fontFamily: "DM Sans",
      }}
    >
      <div
        style={{
          display: "flex",
          flex: 1,
          borderLeft: `10px solid ${ogPalette.primary}`,
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            padding: "48px 56px 32px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 32,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 16px",
                borderRadius: 999,
                background: ogPalette.primary,
                color: ogPalette.primaryForeground,
                fontSize: 18,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {pill}
            </div>
          </div>

          {children}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 56px",
          borderTop: `1px solid ${ogPalette.border}`,
          background: ogPalette.card,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assets.logoDataUrl}
            alt=""
            width={44}
            height={44}
            style={{ borderRadius: 10 }}
          />
          <span
            style={{
              fontFamily: "Fraunces",
              fontSize: 28,
              fontWeight: 600,
              color: ogPalette.foreground,
            }}
          >
            {siteConfig.name}
          </span>
        </div>
        <span
          style={{
            fontSize: 22,
            color: ogPalette.muted,
            fontWeight: 500,
          }}
        >
          Toulouse
        </span>
      </div>
    </div>
  );
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
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 180,
            minWidth: 180,
            padding: "24px 20px",
            borderRadius: 24,
            background: ogPalette.card,
            border: `1px solid ${ogPalette.border}`,
            boxShadow: "0 8px 24px rgba(58, 50, 46, 0.06)",
          }}
        >
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
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
            gap: 20,
            minWidth: 0,
          }}
        >
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

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              fontSize: 26,
              lineHeight: 1.35,
              color: ogPalette.muted,
            }}
          >
            <span style={{ display: "flex", color: ogPalette.foreground }}>
              {fullDate}
              {!allDay && scheduleLabel ? ` · ${scheduleLabel}` : null}
            </span>
            {venue ? <span>Lieu · {truncate(venue, 60)}</span> : null}
            <span>Par · {truncate(organizer, 60)}</span>
          </div>

          {badges.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {badges.map((badge) => {
                const colors = badgeColors(badge.tone);

                return (
                  <span
                    key={badge.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "8px 16px",
                      borderRadius: 999,
                      fontSize: 20,
                      fontWeight: 500,
                      background: colors.background,
                      color: colors.color,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {badge.label}
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>
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

  return new ImageResponse(
    event ? (
      <EventOgLayout event={event} assets={assets} />
    ) : (
      <FallbackOgLayout assets={assets} />
    ),
    {
      ...ogSize,
      fonts: [
        {
          name: "Fraunces",
          data: assets.fraunces600,
          weight: 600,
          style: "normal",
        },
        {
          name: "DM Sans",
          data: assets.dmSans400,
          weight: 400,
          style: "normal",
        },
        {
          name: "DM Sans",
          data: assets.dmSans500,
          weight: 500,
          style: "normal",
        },
      ],
    },
  );
}
