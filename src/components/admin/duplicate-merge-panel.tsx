"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useLinkDuplicateEvent,
  useUnlinkDuplicateEvent,
} from "@/lib/admin/use-events-admin";
import { formatEventDate } from "@/lib/events/format";

type DuplicateEventSummary = {
  id: string;
  slug: string;
  title: string;
  startAt: string;
  endAt: string | null;
  isAllDay: boolean;
  source: { name: string };
  organization: { name: string } | null;
  venue: { name: string } | null;
};

type DuplicateMergePanelProps = {
  eventId: string;
  canonicalEvent: DuplicateEventSummary | null;
  linkedDuplicates: DuplicateEventSummary[];
  candidates: DuplicateEventSummary[];
};

function DuplicateEventRow({
  event,
  action,
}: {
  event: DuplicateEventSummary;
  action: React.ReactNode;
}) {
  return (
    <li className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{event.title}</p>
        <p className="text-muted-foreground text-sm">
          {formatEventDate(
            new Date(event.startAt),
            event.endAt ? new Date(event.endAt) : null,
            event.isAllDay,
          )}
        </p>
        <p className="text-muted-foreground text-xs">
          {event.organization?.name ?? event.source.name}
          {event.venue ? ` · ${event.venue.name}` : ""}
        </p>
        <Link
          href={`/evenement/${event.slug}`}
          className="text-muted-foreground text-xs hover:underline"
        >
          /evenement/{event.slug}
        </Link>
      </div>
      {action}
    </li>
  );
}

export function DuplicateMergePanel({
  eventId,
  canonicalEvent,
  linkedDuplicates,
  candidates,
}: DuplicateMergePanelProps) {
  const linkDuplicate = useLinkDuplicateEvent();
  const unlinkDuplicate = useUnlinkDuplicateEvent();
  const [error, setError] = useState<string | null>(null);

  const busyId = linkDuplicate.isPending
    ? `${linkDuplicate.variables?.duplicateEventId}:${linkDuplicate.variables?.canonicalEventId}`
    : unlinkDuplicate.isPending
      ? unlinkDuplicate.variables
      : null;

  async function linkDuplicateToCanonical(
    duplicateEventId: string,
    canonicalEventId: string,
  ) {
    setError(null);

    try {
      await linkDuplicate.mutateAsync({ duplicateEventId, canonicalEventId });
    } catch (linkError) {
      setError(
        linkError instanceof Error
          ? linkError.message
          : "Impossible de lier les événements.",
      );
    }
  }

  async function unlinkDuplicateEvent(duplicateId: string) {
    setError(null);

    try {
      await unlinkDuplicate.mutateAsync(duplicateId);
    } catch (unlinkError) {
      setError(
        unlinkError instanceof Error
          ? unlinkError.message
          : "Impossible de délier le doublon.",
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Doublons</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Liez un événement importé depuis une autre source au même événement
          principal. Le doublon disparaît de l&apos;agenda et son slug redirige
          vers l&apos;événement principal.
        </p>

        {error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {canonicalEvent ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Événement principal</p>
            <DuplicateEventRow
              event={canonicalEvent}
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busyId !== null}
                  onClick={() => unlinkDuplicateEvent(eventId)}
                >
                  {busyId === eventId ? "Déliaison…" : "Délier"}
                </Button>
              }
            />
          </div>
        ) : null}

        {linkedDuplicates.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Doublons liés à cet événement</p>
            <ul className="flex flex-col gap-2">
              {linkedDuplicates.map((duplicate) => (
                <DuplicateEventRow
                  key={duplicate.id}
                  event={duplicate}
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={busyId !== null}
                      onClick={() => unlinkDuplicateEvent(duplicate.id)}
                    >
                      {busyId === duplicate.id ? "Déliaison…" : "Délier"}
                    </Button>
                  }
                />
              ))}
            </ul>
          </div>
        ) : null}

        {!canonicalEvent && candidates.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Candidats probables</p>
            <ul className="flex flex-col gap-2">
              {candidates.map((candidate) => {
                const makeCanonicalBusyId = `${eventId}:${candidate.id}`;
                const markDuplicateBusyId = `${candidate.id}:${eventId}`;

                return (
                  <DuplicateEventRow
                    key={candidate.id}
                    event={candidate}
                    action={
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={busyId !== null}
                          onClick={() =>
                            linkDuplicateToCanonical(eventId, candidate.id)
                          }
                        >
                          {busyId === makeCanonicalBusyId
                            ? "Liaison…"
                            : "Utiliser comme principal"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={busyId !== null}
                          onClick={() =>
                            linkDuplicateToCanonical(candidate.id, eventId)
                          }
                        >
                          {busyId === markDuplicateBusyId
                            ? "Liaison…"
                            : "Marquer comme doublon"}
                        </Button>
                      </div>
                    }
                  />
                );
              })}
            </ul>
          </div>
        ) : null}

        {!canonicalEvent &&
        linkedDuplicates.length === 0 &&
        candidates.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucun doublon détecté pour le moment (même créneau ±1 h, titre
            proche, source différente).
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
