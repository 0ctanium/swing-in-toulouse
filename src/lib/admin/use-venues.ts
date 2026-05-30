import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { fetchJson, fetchJsonVoid } from "@/lib/api/fetch-json";
import { adminQueryKeys } from "@/lib/admin/query-keys";
import type { VenueAssignment } from "@/lib/venues/matching";

export type BulkAssignPayload = {
  targetVenueId: string;
  assignments?: VenueAssignment[];
  sourceVenueIds?: string[];
  locationKey?: string;
  locationKeys?: string[];
};

type BulkAssignInput = {
  payload: BulkAssignPayload;
  dryRun?: boolean;
};

type BulkAssignResult = {
  matched?: number;
  updated?: number;
  aliasesCreated?: number;
};

async function bulkAssignVenues({
  payload,
  dryRun = false,
}: BulkAssignInput): Promise<BulkAssignResult> {
  return fetchJson<BulkAssignResult>(
    "/api/admin/venues/bulk-assign",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, dryRun, debug: true }),
    },
    "Correction impossible.",
  );
}

export function useBulkAssignVenues() {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.venues(), "bulk-assign"],
    mutationFn: bulkAssignVenues,
    onSuccess: (_data, variables) => {
      if (!variables.dryRun) {
        router.refresh();
      }
    },
  });
}

async function removeVenueAlias(aliasId: string) {
  return fetchJsonVoid(
    `/api/admin/venues/${aliasId}/alias`,
    { method: "DELETE" },
    "Suppression impossible.",
  );
}

export function useRemoveVenueAlias() {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.venues(), "remove-alias"],
    mutationFn: removeVenueAlias,
    onSuccess: () => {
      router.refresh();
    },
  });
}

type ConfirmVenueInput = {
  venueId: string;
  placeId: string;
  name: string;
};

async function confirmVenue({ venueId, placeId, name }: ConfirmVenueInput) {
  return fetchJson(
    `/api/admin/venues/${venueId}/confirm`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId, name }),
    },
    "Confirmation impossible.",
  );
}

export function useConfirmVenue() {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.venues(), "confirm"],
    mutationFn: confirmVenue,
    onSuccess: () => {
      router.refresh();
    },
  });
}
