import { RelatedEventsSection } from "@/components/events/related-events-section";
import { Separator } from "@/components/ui/separator";
import { getRelatedEvents } from "@/lib/events/queries";

type EventRelatedEventsProps = {
  slug: string;
  organization: { slug: string; name: string } | null;
  venue: { slug: string; name: string } | null;
};

export async function EventRelatedEvents({
  slug,
  organization,
  venue,
}: EventRelatedEventsProps) {
  const relatedEvents = await getRelatedEvents(
    slug,
    organization?.slug,
    venue?.slug,
  );

  if (relatedEvents.length === 0) {
    return null;
  }

  const relatedTitle = organization
    ? `Autres événements de ${organization.name}`
    : venue
      ? `Autres événements au ${venue.name}`
      : "Événements similaires";

  return (
    <>
      <Separator />
      <RelatedEventsSection title={relatedTitle} events={relatedEvents} />
    </>
  );
}
