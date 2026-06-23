import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AGENDA_PREFERENCES_COOKIE,
  defaultAgendaPreferences,
  parseAgendaPreferences,
  serializeAgendaPreferences,
  writeAgendaPreferencesCookie,
} from "@/lib/events/agenda-preferences";

describe("parseAgendaPreferences", () => {
  it("returns defaults for empty input", () => {
    expect(parseAgendaPreferences(null)).toEqual(defaultAgendaPreferences);
    expect(parseAgendaPreferences(undefined)).toEqual(defaultAgendaPreferences);
  });

  it("parses valid preferences", () => {
    expect(
      parseAgendaPreferences(
        JSON.stringify({ viewMode: "planning", agendaMode: "4-weeks" }),
      ),
    ).toEqual({
      viewMode: "planning",
      agendaMode: "4-weeks",
    });
  });

  it("falls back to defaults for invalid values", () => {
    expect(
      parseAgendaPreferences(JSON.stringify({ viewMode: "invalid", agendaMode: "week" })),
    ).toEqual(defaultAgendaPreferences);
  });

  it("falls back to defaults for malformed JSON", () => {
    expect(parseAgendaPreferences("{not-json")).toEqual(defaultAgendaPreferences);
  });
});

describe("serializeAgendaPreferences", () => {
  it("round-trips through parseAgendaPreferences", () => {
    const preferences = { viewMode: "planning" as const, agendaMode: "month" as const };
    expect(parseAgendaPreferences(serializeAgendaPreferences(preferences))).toEqual(
      preferences,
    );
  });
});

describe("writeAgendaPreferencesCookie", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("writes a cookie with the serialized preferences", () => {
    const cookie = { value: "" };
    vi.stubGlobal("document", {
      set cookie(value: string) {
        cookie.value = value;
      },
      get cookie() {
        return cookie.value;
      },
    });

    writeAgendaPreferencesCookie({
      viewMode: "agenda",
      agendaMode: "month",
    });

    expect(cookie.value).toContain(`${AGENDA_PREFERENCES_COOKIE}=`);
    expect(cookie.value).toContain("path=/");
    expect(cookie.value).toContain("samesite=lax");
  });
});
