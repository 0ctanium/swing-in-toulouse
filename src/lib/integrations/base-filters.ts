import type { IntegrationBaseFilters } from "@/db/schema";
import type { AgendaBaseFilters } from "@/lib/events/agenda-filters";

export function integrationBaseFiltersToAgenda(
  baseFilters: IntegrationBaseFilters | null | undefined,
): AgendaBaseFilters | undefined {
  if (!baseFilters) {
    return undefined;
  }

  const next: AgendaBaseFilters = {};

  if (baseFilters.category?.length) {
    next.category = baseFilters.category;
  }
  if (baseFilters.venue?.length) {
    next.venue = baseFilters.venue;
  }
  if (baseFilters.org?.length) {
    next.org = baseFilters.org;
  }

  return Object.keys(next).length > 0 ? next : undefined;
}

export function buildEmbedAgendaBaseFilters(input: {
  organizationSlug: string;
  integrationBaseFilters?: IntegrationBaseFilters | null;
}): AgendaBaseFilters {
  return {
    ...integrationBaseFiltersToAgenda(input.integrationBaseFilters),
    org: [input.organizationSlug],
  };
}
