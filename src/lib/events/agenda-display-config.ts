import type { AgendaMode, AgendaPreferences, ViewMode } from "@/lib/events/agenda-preferences";

export type AgendaDisplayConfig = {
  showFilters: boolean;
  planningViewEnabled: boolean;
  calendarViewEnabled: boolean;
  monthViewEnabled: boolean;
  fourWeeksViewEnabled: boolean;
};

export const defaultAgendaDisplayConfig: AgendaDisplayConfig = {
  showFilters: true,
  planningViewEnabled: true,
  calendarViewEnabled: true,
  monthViewEnabled: true,
  fourWeeksViewEnabled: true,
};

export function mergeAgendaDisplayConfig(
  partial?: Partial<AgendaDisplayConfig> | null,
): AgendaDisplayConfig {
  if (!partial) {
    return defaultAgendaDisplayConfig;
  }

  return {
    ...defaultAgendaDisplayConfig,
    ...partial,
  };
}

export function getViewModeToggleOptions(config: AgendaDisplayConfig) {
  const options: Array<{ value: ViewMode; label: string }> = [];

  if (config.calendarViewEnabled) {
    options.push({ value: "agenda", label: "Agenda" });
  }

  if (config.planningViewEnabled) {
    options.push({ value: "planning", label: "Planning" });
  }

  return options;
}

export function getAgendaModeToggleOptions(config: AgendaDisplayConfig) {
  const options: Array<{ value: AgendaMode; label: string }> = [];

  if (config.monthViewEnabled) {
    options.push({ value: "month", label: "Mois" });
  }

  if (config.fourWeeksViewEnabled) {
    options.push({ value: "4-weeks", label: "4 sem." });
  }

  return options;
}

export function shouldShowViewModeToggle(config: AgendaDisplayConfig) {
  return getViewModeToggleOptions(config).length > 1;
}

export function shouldShowAgendaModeToggle(config: AgendaDisplayConfig) {
  return (
    config.calendarViewEnabled &&
    getAgendaModeToggleOptions(config).length > 1
  );
}

function resolveViewMode(
  preference: ViewMode,
  config: AgendaDisplayConfig,
): ViewMode {
  const options = getViewModeToggleOptions(config);

  if (options.length === 0) {
    return "agenda";
  }

  if (options.some((option) => option.value === preference)) {
    return preference;
  }

  return options[0]!.value;
}

function resolveAgendaMode(
  preference: AgendaMode,
  config: AgendaDisplayConfig,
): AgendaMode {
  const options = getAgendaModeToggleOptions(config);

  if (options.length === 0) {
    return "month";
  }

  if (options.some((option) => option.value === preference)) {
    return preference;
  }

  return options[0]!.value;
}

export function resolveAgendaPreferencesForDisplay(
  preferences: AgendaPreferences,
  config: AgendaDisplayConfig,
): AgendaPreferences {
  const viewMode = resolveViewMode(preferences.viewMode, config);

  return {
    viewMode,
    agendaMode:
      viewMode === "agenda"
        ? resolveAgendaMode(preferences.agendaMode, config)
        : preferences.agendaMode,
  };
}

export function clampViewMode(
  viewMode: ViewMode,
  config: AgendaDisplayConfig,
): ViewMode {
  return resolveViewMode(viewMode, config);
}

export function clampAgendaMode(
  agendaMode: AgendaMode,
  config: AgendaDisplayConfig,
): AgendaMode {
  return resolveAgendaMode(agendaMode, config);
}
