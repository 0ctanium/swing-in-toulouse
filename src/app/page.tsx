import Link from "next/link";
import { addDays } from "date-fns";

import { EventList } from "@/components/events/event-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUpcomingEvents, listOrganizers } from "@/lib/events/queries";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [events, organizers] = await Promise.all([
    getUpcomingEvents({ to: addDays(new Date(), 14) }),
    listOrganizers(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <p className="text-primary text-sm font-medium uppercase tracking-[0.2em]">
          Agenda swing · Toulouse
        </p>
        <h1 className="font-heading max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
          Tous les événements swing à Toulouse, au même endroit
        </h1>
        <p className="text-muted-foreground max-w-2xl text-lg">
          {siteConfig.description} Import automatique depuis les calendriers
          des organisateurs — abonnez-vous au flux iCal pour ne rien manquer.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/agenda"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voir l&apos;agenda
          </Link>
          <Link
            href="/agenda.ics"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            S&apos;abonner au calendrier
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold">
              Prochains événements
            </h2>
            <p className="text-muted-foreground text-sm">
              Les 14 prochains jours
            </p>
          </div>
          <Link href="/agenda" className="text-sm font-medium underline">
            Tout voir
          </Link>
        </div>
        <EventList events={events} />
      </section>

      {organizers.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-2xl font-semibold">Organisateurs</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {organizers.map((organizer) => (
              <Card key={organizer.id}>
                <CardHeader>
                  <CardTitle>
                    <Link
                      href={`/organisateur/${organizer.slug}`}
                      className="hover:underline"
                    >
                      {organizer.name}
                    </Link>
                  </CardTitle>
                  {organizer.description ? (
                    <CardDescription>{organizer.description}</CardDescription>
                  ) : null}
                </CardHeader>
                {organizer.website ? (
                  <CardContent>
                    <a
                      href={organizer.website}
                      className="text-sm underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Site web
                    </a>
                  </CardContent>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
