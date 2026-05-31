import type { Organization, Venue } from "@/db/schema";
import type { EventOccurrence } from "@/lib/ical/recurrence";
import { loadOgAssets } from "@/lib/og/assets";
import { OgBadges, type OgBadge } from "@/lib/og/badges";
import { createOgImageResponse } from "@/lib/og/create-image-response";
import {
  formatUpcomingEventsCount,
  getInitials,
} from "@/lib/og/initials";
import { ogPalette } from "@/lib/og/palette";
import {
  OgContentColumn,
  OgMetaLines,
  OgShell,
  OgSidebarCard,
} from "@/lib/og/shell";
import { truncate } from "@/lib/og/truncate";
import { formatOrganizationCategory } from "@/lib/organizations/categories";
import { getVenueDisplayAddress } from "@/lib/venues/display";
import { siteConfig } from "@/lib/site";

type OrganizerOgData = Pick<
  Organization,
  "name" | "description" | "category" | "dances"
> & {
  venue: Venue | null;
  events: EventOccurrence[];
};

function organizerBadges(organizer: OrganizerOgData): OgBadge[] {
  const badges: OgBadge[] = [];

  const categoryLabel = formatOrganizationCategory(organizer.category);
  if (categoryLabel) {
    badges.push({ label: categoryLabel, tone: "default" });
  }

  for (const dance of organizer.dances ?? []) {
    if (badges.length >= 4) {
      break;
    }

    if (!badges.some((badge) => badge.label === dance)) {
      badges.push({ label: dance, tone: "default" });
    }
  }

  const eventsBadge = formatUpcomingEventsCount(organizer.events.length);
  if (badges.length < 4) {
    badges.push({
      label: eventsBadge,
      tone: organizer.events.length > 0 ? "default" : "muted",
    });
  }

  return badges;
}

function OrganizerOgLayout({
  organizer,
  assets,
}: {
  organizer: OrganizerOgData;
  assets: Awaited<ReturnType<typeof loadOgAssets>>;
}) {
  const categoryLabel = formatOrganizationCategory(organizer.category);
  const address = organizer.venue
    ? getVenueDisplayAddress(organizer.venue)
    : null;
  const badges = organizerBadges(organizer);
  const initials = getInitials(organizer.name);

  return (
    <OgShell assets={assets} pill="Organisateur">
      <div style={{ display: "flex", flex: 1, gap: 40, alignItems: "stretch" }}>
        <OgSidebarCard>
          <span
            style={{
              fontFamily: "Fraunces",
              fontSize: 72,
              fontWeight: 600,
              lineHeight: 1,
              color: ogPalette.primary,
            }}
          >
            {initials}
          </span>
          {categoryLabel ? (
            <span
              style={{
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: "0.08em",
                color: ogPalette.muted,
                marginTop: 16,
                textAlign: "center",
              }}
            >
              {categoryLabel.toUpperCase()}
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
              color: ogPalette.foreground,
            }}
          >
            {truncate(organizer.name, 70)}
          </h1>

          {organizer.description ? (
            <p
              style={{
                fontSize: 26,
                lineHeight: 1.4,
                color: ogPalette.muted,
                margin: 0,
                maxWidth: 820,
              }}
            >
              {truncate(organizer.description, 120)}
            </p>
          ) : null}

          <OgMetaLines>
            {categoryLabel ? (
              <span style={{ color: ogPalette.foreground }}>
                {categoryLabel} swing · Toulouse
              </span>
            ) : (
              <span style={{ color: ogPalette.foreground }}>
                Événements swing · Toulouse
              </span>
            )}
            {address ? <span>Lieu · {truncate(address, 70)}</span> : null}
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
    <OgShell assets={assets} pill="Organisateur">
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
          Organisateurs swing
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

export async function renderOrganizerOgImage(organizer: OrganizerOgData | null) {
  const assets = await loadOgAssets();

  return createOgImageResponse(
    organizer ? (
      <OrganizerOgLayout organizer={organizer} assets={assets} />
    ) : (
      <FallbackOgLayout assets={assets} />
    ),
    assets,
  );
}
