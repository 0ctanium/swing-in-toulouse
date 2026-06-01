import { useQuery } from "@tanstack/react-query";

import { fetchJson } from "@/lib/api/fetch-json";
import { adminQueryKeys } from "@/lib/admin/query-keys";
import type {
  DuplicateConfidence,
  VenueDuplicateCandidate,
} from "@/lib/venues/duplicate-candidates";

export type VenueDuplicateSearch = {
  name: string;
  address?: string | null;
  city?: string;
  formattedAddress?: string | null;
  googlePlaceId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  requireAddressSignal?: boolean;
  minConfidence?: DuplicateConfidence;
};

async function fetchVenueDuplicates(
  venueId: string,
  search: VenueDuplicateSearch,
): Promise<VenueDuplicateCandidate[]> {
  const data = await fetchJson<{ candidates: VenueDuplicateCandidate[] }>(
    `/api/admin/venues/${venueId}/duplicates`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(search),
    },
    "Recherche de doublons impossible.",
  );

  return data.candidates ?? [];
}

export function useVenueDuplicateCandidates(
  venueId: string,
  search: VenueDuplicateSearch | null,
) {
  return useQuery({
    queryKey: [
      ...adminQueryKeys.venues(),
      venueId,
      "duplicates",
      search,
    ] as const,
    queryFn: () => fetchVenueDuplicates(venueId, search!),
    enabled: search != null && search.name.trim().length > 0,
    staleTime: 30_000,
  });
}
