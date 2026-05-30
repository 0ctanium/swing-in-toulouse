import type { VenueWithStats } from "@/lib/venues/matching";

export function VenueAliasBadge({ venue }: { venue: VenueWithStats }) {
  if (venue.canonicalVenueName) {
    return (
      <span className="inline-flex w-fit rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-950 dark:text-amber-100">
        Alias → {venue.canonicalVenueName}
      </span>
    );
  }

  if (venue.aliasCount > 0) {
    return (
      <span className="text-muted-foreground text-xs">
        Principal · {venue.aliasCount} alias
      </span>
    );
  }

  return null;
}
