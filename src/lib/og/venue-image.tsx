import type { Venue } from "@/db/schema";
import type { EventOccurrence } from "@/lib/ical/recurrence";
import { loadOgAssets } from "@/lib/og/assets";
import { OgBadges, type OgBadge } from "@/lib/og/badges";
import { createOgImageResponse } from "@/lib/og/create-image-response";
import { formatUpcomingEventsCount } from "@/lib/og/initials";
import { ogPalette } from "@/lib/og/palette";
import {
  OgContentColumn,
  OgMetaLines,
  OgShell,
  OgSidebarCard,
} from "@/lib/og/shell";
import { truncate } from "@/lib/og/truncate";
import { formatVenueCategory } from "@/lib/venues/categories";
import { getVenueDisplayAddress } from "@/lib/venues/display";
import { siteConfig } from "@/lib/site";

type VenueOgData = Pick<Venue, "name" | "city" | "category"> & {
  events: EventOccurrence[];
  displayAddress: string | null;
};

function venueBadges(venue: VenueOgData): OgBadge[] {
  const badges: OgBadge[] = [];

  const categoryLabel = formatVenueCategory(venue.category);
  if (categoryLabel) {
    badges.push({ label: categoryLabel, tone: "default" });
  }

  badges.push({
    label: formatUpcomingEventsCount(venue.events.length),
    tone: venue.events.length > 0 ? "default" : "muted",
  });

  return badges;
}

function venueSidebarLabel(category: Venue["category"]) {
  const categoryLabel = formatVenueCategory(category);

  if (!categoryLabel) {
    return "LIEU";
  }

  const firstWord = categoryLabel.split(/[\s/]/)[0];
  return firstWord ? firstWord.toUpperCase() : "LIEU";
}

function VenueOgLayout({
  venue,
  assets,
}: {
  venue: VenueOgData;
  assets: Awaited<ReturnType<typeof loadOgAssets>>;
}) {
  const categoryLabel = formatVenueCategory(venue.category);
  const badges = venueBadges(venue);
  const sidebarLabel = venueSidebarLabel(venue.category);

  return (
    <OgShell assets={assets} pill="Lieu">
      <div style={{ display: "flex", flex: 1, gap: 40, alignItems: "stretch" }}>
        <OgSidebarCard>
          <span
            style={{
              fontFamily: "Fraunces",
              fontSize: 48,
              fontWeight: 600,
              lineHeight: 1.1,
              color: ogPalette.primary,
              textAlign: "center",
            }}
          >
            {sidebarLabel}
          </span>
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
            {venue.city.toUpperCase()}
          </span>
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
            {truncate(venue.name, 70)}
          </h1>

          <OgMetaLines>
            {categoryLabel ? (
              <span style={{ color: ogPalette.foreground }}>
                {categoryLabel} · {venue.city}
              </span>
            ) : (
              <span style={{ color: ogPalette.foreground }}>
                Événements swing · {venue.city}
              </span>
            )}
            {venue.displayAddress ? (
              <span>Adresse · {truncate(venue.displayAddress, 80)}</span>
            ) : null}
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
    <OgShell assets={assets} pill="Lieu">
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
          Lieux swing
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

export async function renderVenueOgImage(venue: VenueOgData | null) {
  const assets = await loadOgAssets();

  return createOgImageResponse(
    venue ? <VenueOgLayout venue={venue} assets={assets} /> : <FallbackOgLayout assets={assets} />,
    assets,
  );
}

export function toVenueOgData(
  venue: Pick<
    Venue,
    | "name"
    | "city"
    | "category"
    | "address"
    | "formattedAddress"
    | "addressConfirmedAt"
    | "latitude"
    | "longitude"
  > & {
    events: EventOccurrence[];
  },
): VenueOgData {
  return {
    name: venue.name,
    city: venue.city,
    category: venue.category,
    events: venue.events,
    displayAddress: getVenueDisplayAddress(venue),
  };
}
