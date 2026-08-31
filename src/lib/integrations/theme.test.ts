import { describe, expect, it } from "vitest";

import { defaultAgendaDisplayConfig } from "@/lib/events/agenda-display-config";
import {
  buildAppearanceFormState,
  buildIntegrationThemeDefaults,
  resolveEmbedAppearanceFromForm,
  resolveEmbedAppearanceFromTheme,
  serializeAppearanceFormState,
} from "@/lib/integrations/theme";

const defaults = buildIntegrationThemeDefaults({
  integrationName: "Agenda",
  organizationName: "TRAC",
});

describe("integration theme", () => {
  it("prefills the form with defaults when theme is missing", () => {
    expect(buildAppearanceFormState(null, defaults)).toEqual({
      general: {
        pageTitle: "Agenda — TRAC",
        pageDescription: "",
      },
      header: {
        displayHeader: true,
        mainTitle: "TRAC",
        secondaryTitle: "Agenda",
        displayOrganizerLink: true,
      },
      agenda: defaultAgendaDisplayConfig,
    });
  });

  it("keeps empty strings from saved theme", () => {
    const form = buildAppearanceFormState(
      {
        general: { pageTitle: "" },
        header: { mainTitle: "", secondaryTitle: "" },
      },
      defaults,
    );

    expect(form.general.pageTitle).toBe("");
    expect(form.header.mainTitle).toBe("");
    expect(form.header.secondaryTitle).toBe("");
  });

  it("resolves stored theme without runtime fallbacks for empty values", () => {
    expect(
      resolveEmbedAppearanceFromTheme(
        {
          header: {
            mainTitle: "",
            secondaryTitle: "",
          },
        },
        defaults,
      ),
    ).toEqual({
      metadata: {
        title: "Agenda — TRAC",
        description: null,
      },
      header: {
        display: true,
        mainTitle: null,
        secondaryTitle: null,
        displayOrganizerLink: true,
      },
      agenda: defaultAgendaDisplayConfig,
    });
  });

  it("round-trips appearance form state", () => {
    const form = buildAppearanceFormState(null, defaults);
    form.general.pageDescription = "Description test";
    form.header.displayHeader = false;

    expect(serializeAppearanceFormState(form)).toEqual({
      general: {
        pageTitle: "Agenda — TRAC",
        pageDescription: "Description test",
      },
      header: {
        displayHeader: false,
        mainTitle: "TRAC",
        secondaryTitle: "Agenda",
        displayOrganizerLink: true,
      },
      agenda: defaultAgendaDisplayConfig,
    });
  });

  it("resolves preview form values literally", () => {
    expect(
      resolveEmbedAppearanceFromForm({
        general: {
          pageTitle: "Titre perso",
          pageDescription: "",
        },
        header: {
          displayHeader: true,
          mainTitle: "",
          secondaryTitle: "Sous-titre",
          displayOrganizerLink: false,
        },
        agenda: {
          ...defaultAgendaDisplayConfig,
          showFilters: false,
        },
      }),
    ).toEqual({
      metadata: {
        title: "Titre perso",
        description: null,
      },
      header: {
        display: true,
        mainTitle: null,
        secondaryTitle: "Sous-titre",
        displayOrganizerLink: false,
      },
      agenda: {
        ...defaultAgendaDisplayConfig,
        showFilters: false,
      },
    });
  });
});
