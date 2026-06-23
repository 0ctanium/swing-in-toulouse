import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DuplicateMergePanel } from "@/components/admin/duplicate-merge-panel";
import { EventOverrideForm } from "@/components/admin/event-override-form";
import {
  OccurrenceOverridePanel,
  type AdminOccurrenceItem,
} from "@/components/admin/occurrence-override-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getEventWithOverrides } from "@/lib/events/overrides";
import {
  findDuplicateCandidates,
  getDuplicateLinkInfo,
} from "@/lib/events/duplicates";
import {
  getAdminEventOccurrences,
  listOrganizers,
  listVenues,
} from "@/lib/events/queries";
import { toVenueSelectOption } from "@/lib/venues/select-options";
import { formatEventDate } from "@/lib/events/format";
import type { EventMaster } from "@/db/schema";
import { adminMetadata } from "@/lib/metadata";
import { requireAdminDataScope } from "@/lib/admin/access";
import { assertEventInDataScope } from "@/lib/admin/auth";

type AdminEventPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = adminMetadata({
  title: "Événement",
  description: "Corrections et occurrences pour un événement synchronisé.",
});

function AdminEventPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

async function AdminEventPageContent({ params }: AdminEventPageProps) {
  const { id } = await params;
  const dataScope = await requireAdminDataScope();
  const [eventData, occurrencesData, organizations, venues, duplicateInfo] =
    await Promise.all([
      getEventWithOverrides(id),
      getAdminEventOccurrences(id),
      listOrganizers(),
      listVenues(),
      getDuplicateLinkInfo(id),
    ]);

  if (!eventData || !occurrencesData || !duplicateInfo) {
    notFound();
  }

  if (!(await assertEventInDataScope(id, dataScope))) {
    notFound();
  }

  const scopedOrganizations =
    dataScope.mode === "org"
      ? organizations.filter(
          (organization) => organization.id === dataScope.organizationId,
        )
      : organizations;

  const { synced, masterOverride } = eventData;
  const occurrenceOverrides = new Map(
    eventData.occurrenceOverrides.map((override) => [
      override.occurrenceStartAt?.toISOString() ?? "",
      override,
    ]),
  );

  const occurrenceItems: AdminOccurrenceItem[] =
    occurrencesData.occurrences.map((occurrence) => {
      const key = occurrence.startAt.toISOString();
      const override = occurrenceOverrides.get(key);

      return {
        id: occurrence.id,
        startAt: key,
        endAt: occurrence.endAt?.toISOString() ?? null,
        title: occurrence.title,
        description: occurrence.description,
        locationRaw: occurrence.locationRaw,
        organizationId: occurrence.organization?.id ?? null,
        venueId: occurrence.venue?.id ?? null,
        categories: occurrence.categories,
        status: occurrence.status,
        sourceUrl: occurrence.sourceUrl,
        hasOverride: Boolean(override),
        currentPatch: override?.patch ?? {},
      };
    });

  const duplicateCandidates =
    duplicateInfo.event.canonicalEventId ||
    duplicateInfo.linkedDuplicates.length > 0
      ? []
      : await findDuplicateCandidates(id);

  function serializeDuplicateEvent(event: EventMaster) {
    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt?.toISOString() ?? null,
      isAllDay: event.isAllDay,
      source: { name: event.source.name },
      organization: event.organization
        ? { name: event.organization.name }
        : null,
      venue: event.venue ? { name: event.venue.name } : null,
    };
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/events"
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Retour aux événements
        </Link>
        <h1 className="font-heading text-3xl font-semibold">{synced.title}</h1>
        <p className="text-muted-foreground">
          Source iCal : {synced.source.name}
          {synced.recurrenceRule ? " · événement récurrent" : ""}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Valeurs synchronisées (iCal)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>
            {formatEventDate(synced.startAt, synced.endAt, synced.isAllDay)}
          </p>
          <p>
            {synced.organization?.name ?? "—"} ·{" "}
            {synced.venue?.name ?? synced.locationRaw ?? "—"}
          </p>
          <p>{synced.categories?.join(", ") || "—"}</p>
          {synced.description ? (
            <p className="whitespace-pre-wrap">{synced.description}</p>
          ) : null}
        </CardContent>
      </Card>

      <DuplicateMergePanel
        eventId={synced.id}
        canonicalEvent={
          duplicateInfo.canonicalEvent
            ? serializeDuplicateEvent(duplicateInfo.canonicalEvent)
            : null
        }
        linkedDuplicates={duplicateInfo.linkedDuplicates.map(
          serializeDuplicateEvent,
        )}
        candidates={duplicateCandidates.map(serializeDuplicateEvent)}
      />

      <EventOverrideForm
        eventId={synced.id}
        scope="master"
        synced={{
          title: synced.title,
          description: synced.description,
          organizationId: synced.organizationId,
          venueId: synced.venueId,
          categories: synced.categories,
          status: synced.status,
          sourceUrl: synced.sourceUrl,
        }}
        currentPatch={masterOverride?.patch ?? {}}
        organizations={scopedOrganizations}
        venues={venues.map(toVenueSelectOption)}
      />

      {synced.recurrenceRule && occurrenceItems.length > 0 ? (
        <OccurrenceOverridePanel
          eventId={synced.id}
          occurrences={occurrenceItems}
          organizations={scopedOrganizations}
          venues={venues.map(toVenueSelectOption)}
        />
      ) : null}
    </div>
  );
}

export default function AdminEventPage(props: AdminEventPageProps) {
  return (
    <Suspense fallback={<AdminEventPageSkeleton />}>
      <AdminEventPageContent {...props} />
    </Suspense>
  );
}
