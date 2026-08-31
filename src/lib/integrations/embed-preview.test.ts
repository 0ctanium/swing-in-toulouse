import { describe, expect, it } from "vitest";

import { defaultAgendaDisplayConfig, mergeAgendaDisplayConfig } from "@/lib/events/agenda-display-config";
import {
  buildPreviewEmbedUrl,
  createIntegrationPreviewMessage,
  isIntegrationPreviewMessage,
  parseAppearanceParam,
  serializeAppearanceParam,
} from "@/lib/integrations/embed-preview";
import { buildAppearanceFormState, buildIntegrationThemeDefaults } from "@/lib/integrations/theme";

const defaults = buildIntegrationThemeDefaults({
  integrationName: "Agenda",
  organizationName: "TRAC",
});

const appearanceForm = buildAppearanceFormState(null, defaults);

describe("embed preview helpers", () => {
  it("round-trips appearance in URL params", () => {
    const custom = {
      ...appearanceForm,
      general: {
        ...appearanceForm.general,
        pageTitle: "Titre perso",
      },
    };

    expect(parseAppearanceParam(serializeAppearanceParam(custom))).toEqual(custom);
  });

  it("builds preview URLs with preview and appearance params", () => {
    const url = buildPreviewEmbedUrl(
      "http://localhost:3000/embed/fe072b40-907e-4cc1-a58a-2b2bf142ad3e",
      appearanceForm,
    );

    expect(url).toContain("preview=1");
    expect(url).toContain("appearance=");
  });

  it("validates preview messages", () => {
    const message = createIntegrationPreviewMessage({
      ...appearanceForm,
      agenda: mergeAgendaDisplayConfig({
        ...defaultAgendaDisplayConfig,
        showFilters: false,
      }),
    });

    expect(isIntegrationPreviewMessage(message)).toBe(true);
    expect(isIntegrationPreviewMessage({ type: "other" })).toBe(false);
  });
});
