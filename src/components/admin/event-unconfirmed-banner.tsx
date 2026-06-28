"use client";

import { useConfirmEvent } from "@/lib/admin/use-events-admin";
import { Button } from "@/components/ui/button";

type EventUnconfirmedBannerProps = {
  eventId: string;
};

export function EventUnconfirmedBanner({ eventId }: EventUnconfirmedBannerProps) {
  const confirmEvent = useConfirmEvent();
  const pending = confirmEvent.isPending;

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
      <p className="font-medium">Événement non confirmé</p>
      <p className="mt-1 text-amber-900/80 dark:text-amber-100/80">
        Cet événement synchronisé n&apos;a pas encore été validé. Vous pouvez le
        confirmer tel quel ou corriger les champs ci-dessous avant de
        confirmer.
      </p>
      <Button
        type="button"
        size="sm"
        className="mt-3"
        disabled={pending}
        onClick={() => confirmEvent.mutate({ eventId, patch: {} })}
      >
        {pending ? "Confirmation…" : "Confirmer sans modification"}
      </Button>
    </div>
  );
}
