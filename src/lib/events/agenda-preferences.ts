export const AGENDA_PREFERENCES_COOKIE = "agenda_preferences";

export type ViewMode = "agenda" | "planning";
export type AgendaMode = "month" | "4-weeks";

export type AgendaPreferences = {
  viewMode: ViewMode;
  agendaMode: AgendaMode;
};

export const defaultAgendaPreferences: AgendaPreferences = {
  viewMode: "agenda",
  agendaMode: "month",
};

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function isViewMode(value: unknown): value is ViewMode {
  return value === "agenda" || value === "planning";
}

function isAgendaMode(value: unknown): value is AgendaMode {
  return value === "month" || value === "4-weeks";
}

export function parseAgendaPreferences(
  raw: string | undefined | null,
): AgendaPreferences {
  if (!raw) {
    return defaultAgendaPreferences;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AgendaPreferences>;

    return {
      viewMode: isViewMode(parsed.viewMode)
        ? parsed.viewMode
        : defaultAgendaPreferences.viewMode,
      agendaMode: isAgendaMode(parsed.agendaMode)
        ? parsed.agendaMode
        : defaultAgendaPreferences.agendaMode,
    };
  } catch {
    return defaultAgendaPreferences;
  }
}

export function serializeAgendaPreferences(preferences: AgendaPreferences) {
  return JSON.stringify(preferences);
}

export function writeAgendaPreferencesCookie(preferences: AgendaPreferences) {
  const value = serializeAgendaPreferences(preferences);
  document.cookie = `${AGENDA_PREFERENCES_COOKIE}=${value}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}
