import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { fetchJson, fetchJsonVoid } from "@/lib/api/fetch-json";
import { adminQueryKeys } from "@/lib/admin/query-keys";
import type { VenueCategory } from "@/db/schema";
import type { VenueAssignment } from "@/lib/venues/assignments";
import type { VenueWriteInput } from "@/lib/venues/schemas";

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
  category?: VenueCategory | null;
};

async function confirmVenue({
  venueId,
  placeId,
  name,
  category,
}: ConfirmVenueInput) {
  return fetchJson(
    `/api/admin/venues/${venueId}/confirm`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        placeId,
        name,
        ...(category !== undefined ? { category } : {}),
      }),
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

async function createVenue(input: VenueWriteInput) {
  return fetchJson(
    "/api/admin/venues",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Création impossible.",
  );
}

export function useCreateVenue() {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.venues(), "create"],
    mutationFn: createVenue,
    onSuccess: () => {
      router.refresh();
    },
  });
}

type UpdateVenueBody = {
  name?: string;
  address?: string | null;
  city?: string;
  category?: VenueCategory | null;
};

type UpdateVenueInput = {
  venueId: string;
} & UpdateVenueBody;

async function updateVenue({ venueId, ...body }: UpdateVenueInput) {
  return fetchJson(
    `/api/admin/venues/${venueId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    "Mise à jour impossible.",
  );
}

export function useUpdateVenue(venueId: string) {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.venues(), venueId, "update"],
    mutationFn: (input: UpdateVenueBody) => updateVenue({ venueId, ...input }),
    onSuccess: () => {
      router.refresh();
    },
  });
}

export function useUpdateVenueCategory() {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.venues(), "update-category"],
    mutationFn: ({
      venueId,
      category,
    }: {
      venueId: string;
      category: VenueCategory | null;
    }) => updateVenue({ venueId, category }),
    onSuccess: () => {
      router.refresh();
    },
  });
}
