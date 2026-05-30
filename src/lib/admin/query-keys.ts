export const adminQueryKeys = {
  all: ["admin"] as const,
  sources: () => [...adminQueryKeys.all, "sources"] as const,
  source: (id: string) => [...adminQueryKeys.sources(), id] as const,
  organizations: () => [...adminQueryKeys.all, "organizations"] as const,
  organization: (id: string) =>
    [...adminQueryKeys.organizations(), id] as const,
  venues: () => [...adminQueryKeys.all, "venues"] as const,
  events: () => [...adminQueryKeys.all, "events"] as const,
  event: (id: string) => [...adminQueryKeys.events(), id] as const,
};

export const eventsQueryKeys = {
  all: ["events"] as const,
  range: (from: string, to: string) =>
    [...eventsQueryKeys.all, from, to] as const,
};

export const placesQueryKeys = {
  all: ["admin", "places"] as const,
  autocomplete: (input: string) =>
    [...placesQueryKeys.all, "autocomplete", input] as const,
  details: (placeId: string) =>
    [...placesQueryKeys.all, "details", placeId] as const,
};
