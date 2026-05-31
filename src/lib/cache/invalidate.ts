import { revalidateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/cache/tags";

const REVALIDATE_PROFILE = "max";

export function invalidatePublicEventCache() {
  revalidateTag(CACHE_TAGS.events, REVALIDATE_PROFILE);
  revalidateTag(CACHE_TAGS.agendaFilters, REVALIDATE_PROFILE);
}

export function invalidatePublicOrganizerCache() {
  revalidateTag(CACHE_TAGS.organizers, REVALIDATE_PROFILE);
  invalidatePublicEventCache();
}

export function invalidatePublicVenueCache() {
  revalidateTag(CACHE_TAGS.venues, REVALIDATE_PROFILE);
  invalidatePublicEventCache();
}

export function invalidateAllPublicCache() {
  revalidateTag(CACHE_TAGS.events, REVALIDATE_PROFILE);
  revalidateTag(CACHE_TAGS.organizers, REVALIDATE_PROFILE);
  revalidateTag(CACHE_TAGS.venues, REVALIDATE_PROFILE);
  revalidateTag(CACHE_TAGS.agendaFilters, REVALIDATE_PROFILE);
}
