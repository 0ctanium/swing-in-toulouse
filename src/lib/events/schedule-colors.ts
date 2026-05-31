const SCHEDULE_COLORS = [
  "#e91e63",
  "#1a73e8",
  "#0d904f",
  "#f9ab00",
  "#9334e6",
  "#009688",
  "#d50000",
  "#5f6368",
] as const;

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = value.charCodeAt(index) + ((hash << 5) - hash);
  }

  return Math.abs(hash);
}

export function getScheduleEventColor(seed: string) {
  return SCHEDULE_COLORS[hashString(seed) % SCHEDULE_COLORS.length];
}

export function getScheduleEventColorSeed(event: {
  organization?: { id: string } | null;
  source?: { id: string } | null;
  masterEventId: string;
}) {
  return event.organization?.id ?? event.source?.id ?? event.masterEventId;
}
