import {
  getVenueBySlug,
  resolveVenueBySlug,
} from "@/lib/events/queries";
import { renderVenueOgImage, toVenueOgData } from "@/lib/og/venue-image";

export const alt = "Lieu swing à Toulouse";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type VenueOgImageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Image({ params }: VenueOgImageProps) {
  const { slug } = await params;
  const resolution = await resolveVenueBySlug(slug);

  if (!resolution) {
    return renderVenueOgImage(null);
  }

  const canonicalSlug =
    resolution.kind === "redirect" ? resolution.targetSlug : slug;
  const venue = await getVenueBySlug(canonicalSlug);

  return renderVenueOgImage(venue ? toVenueOgData(venue) : null);
}
