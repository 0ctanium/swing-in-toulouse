import Link from "next/link";
import { notFound } from "next/navigation";

import { EventOverrideForm } from "@/components/admin/event-override-form";
import {
  OccurrenceOverridePanel,
  type AdminOccurrenceItem,
} from "@/components/admin/occurrence-override-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getEventWithOverrides } from "@/lib/events/overrides";
import {
  getAdminEventOccurrences,
  listOrganizers,
  listVenues,
} from "@/lib/events/queries";
import { formatEventDate } from "@/lib/events/format";

export const dynamic = "force-dynamic";

type AdminEventPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEventPage({ params }: AdminEventPageProps) {
  const { id } = await params;
  const [eventData, occurrencesData, organizations, venues] = await Promise.all([
    getEventWithOverrides(id),
    getAdminEventOccurrences(id),
    listOrganizers(),
    listVenues(),
  ]);

  if (!eventData || !occurrencesData) {
    notFound();
  }

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/admin" className="text-muted-foreground text-sm hover:underline">
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
          <CardTitle className="text-lg">Valeurs synchronisées (iCal)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>{formatEventDate(synced.startAt, synced.endAt, synced.isAllDay)}</p>
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

      <EventOverrideForm
        eventId={synced.id}
        scope="master"
        synced={{
          title: synced.title,
          description: synced.description,
          locationRaw: synced.locationRaw,
          organizationId: synced.organizationId,
          venueId: synced.venueId,
          categories: synced.categories,
          status: synced.status,
          sourceUrl: synced.sourceUrl,
        }}
        currentPatch={masterOverride?.patch ?? {}}
        organizations={organizations}
        venues={venues}
      />

      {synced.recurrenceRule && occurrenceItems.length > 0 ? (
        <OccurrenceOverridePanel
          eventId={synced.id}
          occurrences={occurrenceItems}
          organizations={organizations}
          venues={venues}
        />
      ) : null}
    </div>
  );
}
