import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CalendarSubscribeDialog } from "@/components/calendar/calendar-subscribe-dialog";
import { HomePageEventsSection } from "@/components/events/home-page-events-section";
import { Skeleton } from "@/components/ui/skeleton";
import { emptyIcalPayload } from "@/lib/ical/payload";
import { publicMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = publicMetadata({
  title: { absolute: siteConfig.name },
  description: siteConfig.description,
  path: "/",
});

function HomePageEventsSkeleton() {
  return (
    <>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </>
  );
}

export default function HomePage() {
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
          {siteConfig.description} Import automatique depuis les calendriers des
          organisateurs — abonnez-vous au flux iCal pour ne rien manquer.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/agenda"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voir l&apos;agenda
          </Link>
          <CalendarSubscribeDialog payload={emptyIcalPayload()}>
            <Button variant="outline" className="h-9">
              S&apos;abonner au calendrier
            </Button>
          </CalendarSubscribeDialog>
        </div>
      </section>

      <Suspense fallback={<HomePageEventsSkeleton />}>
        <HomePageEventsSection />
      </Suspense>
    </div>
  );
}
