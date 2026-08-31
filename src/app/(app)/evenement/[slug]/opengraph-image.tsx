import { getEventBySlug } from "@/lib/events/queries";
import { renderEventOgImage } from "@/lib/og/event-image";

export const alt = "Événement swing à Toulouse";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type EventOgImageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Image({ params }: EventOgImageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  return renderEventOgImage(event);
}
