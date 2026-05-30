import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EventList } from "@/components/events/event-list";
import { getOrganizerBySlug } from "@/lib/events/queries";

export const dynamic = "force-dynamic";

type OrganizerPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: OrganizerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const organizer = await getOrganizerBySlug(slug);

  if (!organizer) {
    return { title: "Organisateur introuvable" };
  }

  return {
    title: organizer.name,
    description:
      organizer.description ??
      `Événements swing proposés par ${organizer.name} à Toulouse.`,
  };
}

export default async function OrganizerPage({ params }: OrganizerPageProps) {
  const { slug } = await params;
  const organizer = await getOrganizerBySlug(slug);

  if (!organizer) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {organizer.name}
        </h1>
        {organizer.description ? (
          <p className="text-muted-foreground max-w-2xl text-lg">
            {organizer.description}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          {organizer.website ? (
            <a
              href={organizer.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Site web
            </a>
          ) : null}
          <Link
            href={`/organisateur/${slug}.ics`}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            Calendrier iCal
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-2xl font-semibold">
          Prochains événements
        </h2>
        <EventList
          events={organizer.events}
          emptyMessage="Aucun événement à venir pour cet organisateur."
        />
      </section>
    </div>
  );
}
