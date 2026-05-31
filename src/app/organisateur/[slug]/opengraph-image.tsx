import { getOrganizerBySlug } from "@/lib/events/queries";
import { renderOrganizerOgImage } from "@/lib/og/organizer-image";

export const alt = "Organisateur swing à Toulouse";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type OrganizerOgImageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Image({ params }: OrganizerOgImageProps) {
  const { slug } = await params;
  const organizer = await getOrganizerBySlug(slug);

  return renderOrganizerOgImage(organizer);
}
