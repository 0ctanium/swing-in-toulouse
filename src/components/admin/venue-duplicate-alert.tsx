"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  duplicateReasonLabel,
  type VenueDuplicateCandidate,
} from "@/lib/venues/duplicate-candidates";

type VenueDuplicateAlertProps = {
  title: string;
  description?: string;
  candidates: VenueDuplicateCandidate[];
  pending?: boolean;
  onSetAlias: (canonicalVenueId: string) => void;
};

function confidenceBadge(confidence: VenueDuplicateCandidate["confidence"]) {
  switch (confidence) {
    case "certain":
      return <Badge variant="default">Très probable</Badge>;
    case "likely":
      return (
        <Badge
          variant="outline"
          className="border-amber-500/40 text-amber-950 dark:text-amber-100"
        >
          Probable
        </Badge>
      );
    case "possible":
      return <Badge variant="secondary">À vérifier</Badge>;
  }
}

export function VenueDuplicateAlert({
  title,
  description,
  candidates,
  pending = false,
  onSetAlias,
}: VenueDuplicateAlertProps) {
  if (candidates.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
      <div className="flex flex-col gap-1">
        <p className="font-medium">{title}</p>
        {description ? (
          <p className="text-xs opacity-90">{description}</p>
        ) : null}
      </div>

      <ul className="flex flex-col gap-3">
        {candidates.map((candidate) => (
          <li
            key={candidate.venueId}
            className="flex flex-col gap-2 rounded-md border border-amber-500/30 bg-background/60 px-3 py-2 text-foreground"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{candidate.name}</span>
              {confidenceBadge(candidate.confidence)}
              {candidate.confirmed ? (
                <Badge variant="outline">Google confirmé</Badge>
              ) : (
                <Badge variant="secondary">Non confirmé</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              {candidate.addressLine}
              {candidate.distanceMeters != null
                ? ` · ~${Math.round(candidate.distanceMeters)} m`
                : ""}
              {" · "}
              {candidate.eventCount} événement
              {candidate.eventCount === 1 ? "" : "s"}
            </p>
            <p className="text-muted-foreground text-xs">
              {candidate.reasons.map(duplicateReasonLabel).join(" · ")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => onSetAlias(candidate.venueId)}
              >
                Alias vers {candidate.name}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                nativeButton={false}
                render={
                  <Link
                    href={`/lieu/${candidate.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                Voir la fiche
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function splitDuplicateCandidates(candidates: VenueDuplicateCandidate[]) {
  const strong = candidates.filter(
    (candidate) =>
      candidate.confidence === "certain" || candidate.confidence === "likely",
  );
  const weak = candidates.filter(
    (candidate) => candidate.confidence === "possible",
  );

  return { strong, weak };
}
