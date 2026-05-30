"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { EventOverrideForm } from "@/components/admin/event-override-form";
import type { VenueSelectOption } from "@/lib/venues/select-options";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addMonths,
  formatMonthLabel,
  getMonthGrid,
  isSameMonth,
  isToday,
  WEEKDAY_LABELS,
} from "@/lib/events/calendar";
import type { EventOverridePatch } from "@/lib/events/overrides.types";
import { cn } from "@/lib/utils";

type OrganizationOption = { id: string; name: string };
export type AdminOccurrenceItem = {
  id: string;
  startAt: string;
  endAt: string | null;
  title: string;
  description: string | null;
  locationRaw: string | null;
  organizationId: string | null;
  venueId: string | null;
  categories: string[] | null;
  status: "published" | "cancelled";
  sourceUrl: string | null;
  hasOverride: boolean;
  currentPatch: EventOverridePatch;
};

type OccurrenceOverridePanelProps = {
  eventId: string;
  occurrences: AdminOccurrenceItem[];
  organizations: OrganizationOption[];
  venues: VenueSelectOption[];
};

function formatOccurrenceLabel(startAt: string, isAllDay?: boolean) {
  const date = new Date(startAt);
  if (isAllDay) {
    return format(date, "EEEE d MMMM yyyy", { locale: fr });
  }
  return format(date, "EEEE d MMMM yyyy · HH:mm", { locale: fr });
}

export function OccurrenceOverridePanel({
  eventId,
  occurrences,
  organizations,
  venues,
}: OccurrenceOverridePanelProps) {
  const [month, setMonth] = useState(() => new Date());
  const [selectedStartAt, setSelectedStartAt] = useState<string | null>(
    occurrences[0]?.startAt ?? null,
  );
  const [query, setQuery] = useState("");

  const occurrencesByDay = useMemo(() => {
    const map = new Map<string, AdminOccurrenceItem[]>();

    for (const occurrence of occurrences) {
      const key = format(new Date(occurrence.startAt), "yyyy-MM-dd");
      const bucket = map.get(key) ?? [];
      bucket.push(occurrence);
      map.set(key, bucket);
    }

    return map;
  }, [occurrences]);

  const filteredOccurrences = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return occurrences;
    }

    return occurrences.filter((occurrence) => {
      const label = formatOccurrenceLabel(occurrence.startAt).toLowerCase();
      return (
        label.includes(normalized) ||
        occurrence.title.toLowerCase().includes(normalized)
      );
    });
  }, [occurrences, query]);

  const overriddenCount = occurrences.filter((item) => item.hasOverride).length;
  const selected = occurrences.find(
    (occurrence) => occurrence.startAt === selectedStartAt,
  );

  const days = getMonthGrid(month);

  function selectOccurrence(startAt: string) {
    setSelectedStartAt(startAt);
    setMonth(new Date(startAt));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-xl font-semibold">
          Overrides par occurrence
        </h2>
        <p className="text-muted-foreground text-sm">
          {overriddenCount} occurrence{overriddenCount > 1 ? "s" : ""}{" "}
          {overriddenCount > 1 ? "modifiées" : "modifiée"} sur{" "}
          {occurrences.length} à venir. Sélectionnez une date dans le calendrier
          ou via la recherche.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader className="gap-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base capitalize">
                {formatMonthLabel(month)}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setMonth((current) => addMonths(current, -1))}
                  aria-label="Mois précédent"
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setMonth((current) => addMonths(current, 1))}
                  aria-label="Mois suivant"
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
            <label className="relative block">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <input
                type="search"
                placeholder="Rechercher par date ou titre…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-lg border bg-background py-2 pr-3 pl-9 text-sm"
              />
            </label>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="overflow-x-auto">
              <div className="grid min-w-[280px] grid-cols-7 border-b bg-muted/40">
                {WEEKDAY_LABELS.map((weekday) => (
                  <div
                    key={weekday}
                    className="px-1 py-1.5 text-center text-[10px] font-medium text-muted-foreground uppercase"
                  >
                    {weekday}
                  </div>
                ))}
              </div>
              <div className="grid min-w-[280px] grid-cols-7">
                {days.map((day) => {
                  const dayKey = format(day, "yyyy-MM-dd");
                  const dayOccurrences = occurrencesByDay.get(dayKey) ?? [];
                  const hasOccurrence = dayOccurrences.length > 0;
                  const hasOverride = dayOccurrences.some(
                    (item) => item.hasOverride,
                  );
                  const isSelected = dayOccurrences.some(
                    (item) => item.startAt === selectedStartAt,
                  );

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={!hasOccurrence}
                      onClick={() => {
                        if (dayOccurrences[0]) {
                          selectOccurrence(dayOccurrences[0].startAt);
                        }
                      }}
                      className={cn(
                        "relative flex min-h-11 flex-col items-center justify-center border-r border-b p-1 text-xs last:border-r-0",
                        !isSameMonth(day, month) &&
                          "bg-muted/20 text-muted-foreground",
                        hasOccurrence && "hover:bg-primary/10",
                        !hasOccurrence && "cursor-default opacity-40",
                        isSelected &&
                          "bg-primary/15 ring-2 ring-primary ring-inset",
                        isToday(day) && "font-semibold",
                      )}
                    >
                      {format(day, "d", { locale: fr })}
                      {hasOccurrence ? (
                        <span
                          className={cn(
                            "mt-0.5 size-1.5 rounded-full",
                            hasOverride ? "bg-amber-500" : "bg-primary",
                          )}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-primary" />
                Occurrence
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-500" />
                Override
              </span>
            </div>

            <div className="flex max-h-48 flex-col gap-1 overflow-y-auto border-t pt-3">
              {(query
                ? filteredOccurrences
                : filteredOccurrences.slice(0, 20)
              ).map((occurrence) => (
                <button
                  key={occurrence.id}
                  type="button"
                  onClick={() => selectOccurrence(occurrence.startAt)}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted/60",
                    occurrence.startAt === selectedStartAt && "bg-muted",
                  )}
                >
                  <span className="truncate">
                    {formatOccurrenceLabel(occurrence.startAt)}
                  </span>
                  {occurrence.hasOverride ? (
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      modifié
                    </Badge>
                  ) : null}
                </button>
              ))}
              {!query && occurrences.length > 20 ? (
                <p className="text-muted-foreground px-2 py-1 text-xs">
                  {occurrences.length - 20} autres — utilisez la recherche ou le
                  calendrier.
                </p>
              ) : null}
              {query && filteredOccurrences.length === 0 ? (
                <p className="text-muted-foreground px-2 py-1 text-sm">
                  Aucune occurrence trouvée.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div>
          {selected ? (
            <EventOverrideForm
              key={selected.startAt}
              eventId={eventId}
              scope="occurrence"
              occurrenceStartAt={selected.startAt}
              synced={{
                title: selected.title,
                description: selected.description,
                organizationId: selected.organizationId,
                venueId: selected.venueId,
                categories: selected.categories,
                status: selected.status,
                sourceUrl: selected.sourceUrl,
              }}
              currentPatch={selected.currentPatch}
              organizations={organizations}
              venues={venues}
            />
          ) : (
            <Card>
              <CardContent className="text-muted-foreground py-10 text-sm">
                Sélectionnez une occurrence pour la modifier.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
