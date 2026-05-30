"use client";

import { useMemo, useState } from "react";

import { EventConfirmForm } from "@/components/admin/event-confirm-form";
import { Card, CardContent } from "@/components/ui/card";
import type { EventConfirmQueueItem } from "@/lib/events/confirm-queue";

type OrganizationOption = { id: string; name: string };
type VenueOption = { id: string; name: string };

type EventConfirmQueueProps = {
  initialItems: EventConfirmQueueItem[];
  organizations: OrganizationOption[];
  venues: VenueOption[];
  confirmedCount: number;
};

export function EventConfirmQueue({
  initialItems,
  organizations,
  venues,
  confirmedCount,
}: EventConfirmQueueProps) {
  const [items, setItems] = useState(initialItems);
  const totalReviewed = useMemo(
    () => confirmedCount + (initialItems.length - items.length),
    [confirmedCount, initialItems.length, items.length],
  );

  const current = items[0];

  function skipCurrent() {
    if (!current) {
      return;
    }

    setItems([...items.slice(1), current]);
  }

  function confirmCurrent() {
    setItems(items.slice(1));
  }

  if (!current) {
    return (
      <Card>
        <CardContent className="py-10">
          <p className="text-muted-foreground text-sm">
            Tous les événements actifs sont confirmés.
            {confirmedCount > 0
              ? ` ${confirmedCount} événement${confirmedCount > 1 ? "s" : ""} validé${confirmedCount > 1 ? "s" : ""} au total.`
              : ""}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="text-muted-foreground">
          {items.length} événement{items.length > 1 ? "s" : ""} restant
          {items.length > 1 ? "s" : ""}
        </p>
        <p className="text-muted-foreground">
          {totalReviewed} confirmé{totalReviewed > 1 ? "s" : ""} au total
        </p>
      </div>

      <EventConfirmForm
        key={current.id}
        item={current}
        organizations={organizations}
        venues={venues}
        onConfirmed={confirmCurrent}
        onSkip={skipCurrent}
      />
    </div>
  );
}
