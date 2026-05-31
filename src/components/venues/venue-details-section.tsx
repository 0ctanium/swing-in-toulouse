import Link from "next/link";
import { Clock, ExternalLink, MapPin, Star } from "lucide-react";

import { VenueCategoryBadge } from "@/components/venues/venue-category-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getVenueEnrichment,
  venueDetailsSectionVisible,
  type VenueDetailsFields,
} from "@/lib/venues/enrichment";

type VenueDetailsSectionProps = {
  venue: VenueDetailsFields;
  /** When true, shows a link to the dedicated venue page (event / organizer context). */
  linkToVenuePage?: boolean;
  heading?: string;
  /** Hide the section h2 (e.g. inside the event page venue accordion). */
  showHeading?: boolean;
  /** Hide the venue name in the card header (when shown in a parent summary). */
  showVenueTitle?: boolean;
};

function formatRating(rating: number, count: number | null) {
  const countLabel =
    count != null && count > 0
      ? ` (${count.toLocaleString("fr-FR")} avis)`
      : "";

  return `${rating.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}${countLabel}`;
}

export async function VenueDetailsSection({
  venue,
  linkToVenuePage = false,
  heading = "Le lieu",
  showHeading = true,
  showVenueTitle = true,
}: VenueDetailsSectionProps) {
  const enrichment = await getVenueEnrichment(venue);

  if (!venueDetailsSectionVisible(enrichment)) {
    return null;
  }

  const { displayAddress, mapsUrl, mapImageSrc, place } = enrichment;
  const photos = place?.photos ?? [];

  const Wrapper = showHeading ? "section" : "div";

  return (
    <Wrapper
      className="flex flex-col gap-4"
      {...(showHeading
        ? { "aria-labelledby": "venue-details-heading" }
        : {})}
    >
      {showHeading ? (
        <h2 id="venue-details-heading" className="font-heading text-2xl font-semibold">
          {heading}
        </h2>
      ) : null}

      <Card>
        <CardHeader className="gap-2">
          {showVenueTitle || venue.category ? (
            <div className="flex flex-wrap items-center gap-2">
              {showVenueTitle ? (
                linkToVenuePage ? (
                  <CardTitle className="text-xl">
                    <Link href={`/lieu/${venue.slug}`} className="hover:underline">
                      {venue.name}
                    </Link>
                  </CardTitle>
                ) : (
                  <CardTitle className="text-xl">{venue.name}</CardTitle>
                )
              ) : null}
              <VenueCategoryBadge category={venue.category} />
            </div>
          ) : null}

          {displayAddress ? (
            <CardDescription className="inline-flex items-start gap-2 text-base text-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{displayAddress}</span>
            </CardDescription>
          ) : null}

          {place?.rating != null ? (
            <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Star className="size-4 fill-amber-400 text-amber-500" aria-hidden />
              <span>{formatRating(place.rating, place.userRatingCount)}</span>
            </p>
          ) : null}
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {mapImageSrc ? (
            <a
              href={mapsUrl ?? undefined}
              target={mapsUrl ? "_blank" : undefined}
              rel={mapsUrl ? "noreferrer" : undefined}
              className="block overflow-hidden rounded-lg ring-1 ring-foreground/10"
              aria-label={mapsUrl ? "Ouvrir le lieu dans Google Maps" : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mapImageSrc}
                alt={`Carte autour de ${venue.name}`}
                width={640}
                height={320}
                className="h-auto w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </a>
          ) : null}

          {photos.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Photos</p>
              <ul className="grid gap-3 sm:grid-cols-2">
                {photos.map((photo) => (
                  <li key={photo.name} className="flex flex-col gap-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.proxySrc}
                      alt={`Photo de ${venue.name}`}
                      width={photo.widthPx}
                      height={photo.heightPx}
                      className="aspect-[3/2] w-full rounded-lg object-cover ring-1 ring-foreground/10"
                      loading="lazy"
                      decoding="async"
                    />
                    {photo.attributions.length > 0 ? (
                      <p className="text-muted-foreground text-xs">
                        {photo.attributions.map((attribution, index) => (
                          <span key={`${photo.name}-${index}`}>
                            {index > 0 ? " · " : null}
                            {attribution.uri ? (
                              <a
                                href={attribution.uri}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:underline"
                              >
                                {attribution.displayName ?? "Source"}
                              </a>
                            ) : (
                              (attribution.displayName ?? "Source")
                            )}
                          </span>
                        ))}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {place?.openingHours && place.openingHours.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="inline-flex items-center gap-2 text-sm font-medium">
                <Clock className="size-4" aria-hidden />
                Horaires
              </p>
              <ul className="text-muted-foreground flex flex-col gap-0.5 text-sm">
                {place.openingHours.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            {linkToVenuePage && !showVenueTitle ? (
              <Link
                href={`/lieu/${venue.slug}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Fiche du lieu
              </Link>
            ) : null}
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <ExternalLink className="size-4" aria-hidden />
                Ouvrir dans Google Maps
              </a>
            ) : null}
            {place?.websiteUri ? (
              <a
                href={place.websiteUri}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <ExternalLink className="size-4" aria-hidden />
                Site du lieu
              </a>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Wrapper>
  );
}
