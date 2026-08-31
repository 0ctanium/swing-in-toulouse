import { describe, expect, it } from "vitest";

import {
  clampAgendaMode,
  clampViewMode,
  defaultAgendaDisplayConfig,
  getAgendaModeToggleOptions,
  getViewModeToggleOptions,
  mergeAgendaDisplayConfig,
  resolveAgendaPreferencesForDisplay,
  shouldShowAgendaModeToggle,
  shouldShowViewModeToggle,
} from "@/lib/events/agenda-display-config";

describe("mergeAgendaDisplayConfig", () => {
  it("returns defaults when partial is missing", () => {
    expect(mergeAgendaDisplayConfig()).toEqual(defaultAgendaDisplayConfig);
    expect(mergeAgendaDisplayConfig(null)).toEqual(defaultAgendaDisplayConfig);
  });

  it("merges partial values", () => {
    expect(
      mergeAgendaDisplayConfig({
        showFilters: false,
        planningViewEnabled: false,
      }),
    ).toEqual({
      ...defaultAgendaDisplayConfig,
      showFilters: false,
      planningViewEnabled: false,
    });
  });
});

describe("view toggle options", () => {
  it("hides disabled view modes", () => {
    expect(
      getViewModeToggleOptions({
        ...defaultAgendaDisplayConfig,
        planningViewEnabled: false,
      }),
    ).toEqual([{ value: "agenda", label: "Agenda" }]);
  });

  it("knows when to show the view toggle", () => {
    expect(shouldShowViewModeToggle(defaultAgendaDisplayConfig)).toBe(true);
    expect(
      shouldShowViewModeToggle({
        ...defaultAgendaDisplayConfig,
        planningViewEnabled: false,
      }),
    ).toBe(false);
  });
});

describe("agenda mode toggle options", () => {
  it("hides disabled calendar sub-views", () => {
    expect(
      getAgendaModeToggleOptions({
        ...defaultAgendaDisplayConfig,
        fourWeeksViewEnabled: false,
      }),
    ).toEqual([{ value: "month", label: "Mois" }]);
  });

  it("knows when to show the calendar sub-toggle", () => {
    expect(shouldShowAgendaModeToggle(defaultAgendaDisplayConfig)).toBe(true);
    expect(
      shouldShowAgendaModeToggle({
        ...defaultAgendaDisplayConfig,
        monthViewEnabled: false,
      }),
    ).toBe(false);
  });
});

describe("resolveAgendaPreferencesForDisplay", () => {
  it("keeps valid preferences", () => {
    expect(
      resolveAgendaPreferencesForDisplay(
        { viewMode: "planning", agendaMode: "4-weeks" },
        defaultAgendaDisplayConfig,
      ),
    ).toEqual({
      viewMode: "planning",
      agendaMode: "4-weeks",
    });
  });

  it("falls back when a view mode is disabled", () => {
    expect(
      resolveAgendaPreferencesForDisplay(
        { viewMode: "planning", agendaMode: "month" },
        {
          ...defaultAgendaDisplayConfig,
          planningViewEnabled: false,
        },
      ),
    ).toEqual({
      viewMode: "agenda",
      agendaMode: "month",
    });
  });

  it("falls back when a calendar sub-view is disabled", () => {
    expect(
      resolveAgendaPreferencesForDisplay(
        { viewMode: "agenda", agendaMode: "4-weeks" },
        {
          ...defaultAgendaDisplayConfig,
          fourWeeksViewEnabled: false,
        },
      ),
    ).toEqual({
      viewMode: "agenda",
      agendaMode: "month",
    });
  });
});

describe("clamp helpers", () => {
  it("clamps invalid view and agenda modes", () => {
    expect(
      clampViewMode("planning", {
        ...defaultAgendaDisplayConfig,
        planningViewEnabled: false,
      }),
    ).toBe("agenda");
    expect(
      clampAgendaMode("4-weeks", {
        ...defaultAgendaDisplayConfig,
        fourWeeksViewEnabled: false,
      }),
    ).toBe("month");
  });
});
