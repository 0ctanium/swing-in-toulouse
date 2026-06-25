import type { PublishableTagType } from "@/lib/event-collections/types";

export function tagCollectionPath(tagType: PublishableTagType, slug: string) {
  return tagType === "danse" ? `/danse/${slug}` : `/evenements/${slug}`;
}

export function timePresetCollectionPath(slug: string) {
  return `/evenements/${slug}`;
}

export function agendaUrlForCollection(filters: {
  categoryName?: string;
}) {
  const params = new URLSearchParams();

  if (filters.categoryName) {
    params.append("category", filters.categoryName);
  }

  const query = params.toString();
  return query ? `/agenda?${query}` : "/agenda";
}
