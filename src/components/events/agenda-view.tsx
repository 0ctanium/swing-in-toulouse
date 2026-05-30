"use client";

import { useState } from "react";

import { AgendaCalendar } from "@/components/events/agenda-calendar";
import { EventList } from "@/components/events/event-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlanningEvents } from "@/lib/events/use-events";
import { cn } from "@/lib/utils";

type ViewMode = "agenda" | "planning";
type AgendaMode = "month" | "4-weeks";

function ViewToggle({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border bg-muted/40 p-1">
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-md",
            value === option.value && "bg-background shadow-sm",
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

function PlanningListSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex flex-col gap-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

function PlanningList() {
  const { data: events = [], isPending, isError, refetch } = usePlanningEvents();

  if (isError) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-6">
        <p className="text-muted-foreground text-sm">
          Impossible de charger les événements.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (isPending) {
    return <PlanningListSkeleton />;
  }

  return <EventList events={events} />;
}

export function AgendaView() {
  const [viewMode, setViewMode] = useState<ViewMode>("agenda");
  const [agendaMode, setAgendaMode] = useState<AgendaMode>("month");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <ViewToggle
          value={viewMode}
          options={[
            { value: "agenda", label: "Agenda" },
            { value: "planning", label: "Planning" },
          ]}
          onChange={(value) => setViewMode(value as ViewMode)}
        />

        {viewMode === "agenda" ? (
          <ViewToggle
            value={agendaMode}
            options={[
              { value: "month", label: "Mois" },
              { value: "4-weeks", label: "4 semaines" },
            ]}
            onChange={(value) => setAgendaMode(value as AgendaMode)}
          />
        ) : null}
      </div>

      {viewMode === "planning" ? (
        <PlanningList />
      ) : (
        <AgendaCalendar mode={agendaMode} />
      )}
    </div>
  );
}
