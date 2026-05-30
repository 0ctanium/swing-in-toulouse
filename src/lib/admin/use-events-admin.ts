import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { fetchJson, fetchJsonVoid } from "@/lib/api/fetch-json";
import { adminQueryKeys } from "@/lib/admin/query-keys";
import type { EventOverridePatch } from "@/lib/events/overrides.types";

type SaveEventOverrideInput = {
  eventId: string;
  patch: EventOverridePatch;
  occurrenceStartAt?: string | null;
};

async function saveEventOverride({
  eventId,
  patch,
  occurrenceStartAt,
}: SaveEventOverrideInput) {
  return fetchJson(
    `/api/admin/events/${eventId}/override`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patch,
        occurrenceStartAt: occurrenceStartAt ?? null,
      }),
    },
    "Enregistrement impossible.",
  );
}

export function useSaveEventOverride(eventId: string) {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.event(eventId), "override", "save"],
    mutationFn: (input: Omit<SaveEventOverrideInput, "eventId">) =>
      saveEventOverride({ eventId, ...input }),
    onSuccess: () => {
      router.refresh();
    },
  });
}

type DeleteEventOverrideInput = {
  occurrenceStartAt?: string | null;
};

async function deleteEventOverride(
  eventId: string,
  { occurrenceStartAt }: DeleteEventOverrideInput = {},
) {
  const params =
    occurrenceStartAt != null
      ? `?occurrenceStartAt=${encodeURIComponent(occurrenceStartAt)}`
      : "";

  return fetchJsonVoid(
    `/api/admin/events/${eventId}/override${params}`,
    { method: "DELETE" },
    "Suppression impossible.",
  );
}

export function useDeleteEventOverride(eventId: string) {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.event(eventId), "override", "delete"],
    mutationFn: (input: DeleteEventOverrideInput = {}) =>
      deleteEventOverride(eventId, input),
    onSuccess: () => {
      router.refresh();
    },
  });
}

type LinkDuplicateInput = {
  duplicateEventId: string;
  canonicalEventId: string;
};

async function linkDuplicate({
  duplicateEventId,
  canonicalEventId,
}: LinkDuplicateInput) {
  return fetchJson(
    `/api/admin/events/${duplicateEventId}/duplicate`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canonicalEventId }),
    },
    "Impossible de lier les événements.",
  );
}

export function useLinkDuplicateEvent() {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.events(), "link-duplicate"],
    mutationFn: linkDuplicate,
    onSuccess: () => {
      router.refresh();
    },
  });
}

async function unlinkDuplicate(duplicateEventId: string) {
  return fetchJson(
    `/api/admin/events/${duplicateEventId}/duplicate`,
    { method: "DELETE" },
    "Impossible de délier le doublon.",
  );
}

export function useUnlinkDuplicateEvent() {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.events(), "unlink-duplicate"],
    mutationFn: unlinkDuplicate,
    onSuccess: () => {
      router.refresh();
    },
  });
}
