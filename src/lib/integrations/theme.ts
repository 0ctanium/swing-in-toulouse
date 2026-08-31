import {
  defaultAgendaDisplayConfig,
  mergeAgendaDisplayConfig,
  type AgendaDisplayConfig,
} from "@/lib/events/agenda-display-config";

export type IntegrationThemeGeneral = {
  pageTitle?: string | null;
  pageDescription?: string | null;
};

export type IntegrationThemeHeader = {
  displayHeader?: boolean;
  mainTitle?: string | null;
  secondaryTitle?: string | null;
  displayOrganizerLink?: boolean;
};

export type IntegrationTheme = {
  logoUrl?: string | null;
  primaryColor?: string | null;
  fontFamily?: string | null;
  general?: IntegrationThemeGeneral | null;
  header?: IntegrationThemeHeader | null;
  agenda?: Partial<AgendaDisplayConfig> | null;
  /** @deprecated Use agenda */
  display?: Partial<AgendaDisplayConfig> | null;
};

export type IntegrationThemeDefaults = {
  general: {
    pageTitle: string;
    pageDescription: string;
  };
  header: {
    displayHeader: boolean;
    mainTitle: string;
    secondaryTitle: string;
    displayOrganizerLink: boolean;
  };
  agenda: AgendaDisplayConfig;
};

export type IntegrationAppearanceFormState = {
  general: {
    pageTitle: string;
    pageDescription: string;
  };
  header: {
    displayHeader: boolean;
    mainTitle: string;
    secondaryTitle: string;
    displayOrganizerLink: boolean;
  };
  agenda: AgendaDisplayConfig;
};

export type ResolvedEmbedAppearance = {
  metadata: {
    title: string;
    description: string | null;
  };
  header: {
    display: boolean;
    mainTitle: string | null;
    secondaryTitle: string | null;
    displayOrganizerLink: boolean;
  };
  agenda: AgendaDisplayConfig;
};

export function buildIntegrationThemeDefaults(input: {
  integrationName: string;
  organizationName: string;
}): IntegrationThemeDefaults {
  return {
    general: {
      pageTitle: `${input.integrationName} — ${input.organizationName}`,
      pageDescription: "",
    },
    header: {
      displayHeader: true,
      mainTitle: input.organizationName,
      secondaryTitle: input.integrationName,
      displayOrganizerLink: true,
    },
    agenda: defaultAgendaDisplayConfig,
  };
}

function readThemeString(
  value: string | null | undefined,
  defaultValue: string,
) {
  if (value === undefined) {
    return defaultValue;
  }

  if (value === null) {
    return "";
  }

  return value;
}

function readThemeBoolean(
  value: boolean | undefined,
  defaultValue: boolean,
) {
  return value === undefined ? defaultValue : value;
}

export function getThemeAgendaConfig(
  theme: IntegrationTheme | null | undefined,
): Partial<AgendaDisplayConfig> | null | undefined {
  return theme?.agenda ?? theme?.display;
}

export function buildAppearanceFormState(
  theme: IntegrationTheme | null | undefined,
  defaults: IntegrationThemeDefaults,
): IntegrationAppearanceFormState {
  return {
    general: {
      pageTitle: readThemeString(
        theme?.general?.pageTitle,
        defaults.general.pageTitle,
      ),
      pageDescription: readThemeString(
        theme?.general?.pageDescription,
        defaults.general.pageDescription,
      ),
    },
    header: {
      displayHeader: readThemeBoolean(
        theme?.header?.displayHeader,
        defaults.header.displayHeader,
      ),
      mainTitle: readThemeString(
        theme?.header?.mainTitle,
        defaults.header.mainTitle,
      ),
      secondaryTitle: readThemeString(
        theme?.header?.secondaryTitle,
        defaults.header.secondaryTitle,
      ),
      displayOrganizerLink: readThemeBoolean(
        theme?.header?.displayOrganizerLink,
        defaults.header.displayOrganizerLink,
      ),
    },
    agenda: mergeAgendaDisplayConfig(
      getThemeAgendaConfig(theme) ?? defaults.agenda,
    ),
  };
}

export function serializeAppearanceFormState(
  form: IntegrationAppearanceFormState,
): Pick<IntegrationTheme, "general" | "header" | "agenda"> {
  return {
    general: {
      pageTitle: form.general.pageTitle,
      pageDescription: form.general.pageDescription,
    },
    header: {
      displayHeader: form.header.displayHeader,
      mainTitle: form.header.mainTitle,
      secondaryTitle: form.header.secondaryTitle,
      displayOrganizerLink: form.header.displayOrganizerLink,
    },
    agenda: form.agenda,
  };
}

function resolveMetadataText(
  value: string | null | undefined,
  defaultValue: string,
): string {
  if (value === undefined) {
    return defaultValue;
  }

  if (value === null) {
    return "";
  }

  return value;
}

function resolveOptionalText(
  value: string | null | undefined,
  defaultValue: string,
): string | null {
  if (value === undefined) {
    return defaultValue.length > 0 ? defaultValue : null;
  }

  if (value === null || value.length === 0) {
    return null;
  }

  return value;
}

export function resolveEmbedAppearanceFromTheme(
  theme: IntegrationTheme | null | undefined,
  defaults: IntegrationThemeDefaults,
): ResolvedEmbedAppearance {
  const description = resolveMetadataText(
    theme?.general?.pageDescription,
    defaults.general.pageDescription,
  );

  return {
    metadata: {
      title: resolveMetadataText(
        theme?.general?.pageTitle,
        defaults.general.pageTitle,
      ),
      description: description.length > 0 ? description : null,
    },
    header: {
      display: readThemeBoolean(
        theme?.header?.displayHeader,
        defaults.header.displayHeader,
      ),
      mainTitle: resolveOptionalText(
        theme?.header?.mainTitle,
        defaults.header.mainTitle,
      ),
      secondaryTitle: resolveOptionalText(
        theme?.header?.secondaryTitle,
        defaults.header.secondaryTitle,
      ),
      displayOrganizerLink: readThemeBoolean(
        theme?.header?.displayOrganizerLink,
        defaults.header.displayOrganizerLink,
      ),
    },
    agenda: mergeAgendaDisplayConfig(
      getThemeAgendaConfig(theme) ?? defaults.agenda,
    ),
  };
}

export function resolveEmbedAppearanceFromForm(
  form: IntegrationAppearanceFormState,
): ResolvedEmbedAppearance {
  return {
    metadata: {
      title: form.general.pageTitle,
      description: form.general.pageDescription || null,
    },
    header: {
      display: form.header.displayHeader,
      mainTitle: form.header.mainTitle.length > 0 ? form.header.mainTitle : null,
      secondaryTitle:
        form.header.secondaryTitle.length > 0
          ? form.header.secondaryTitle
          : null,
      displayOrganizerLink: form.header.displayOrganizerLink,
    },
    agenda: form.agenda,
  };
}

export function buildEmbedPreviewState(input: {
  integrationName: string;
  organizationName: string;
  theme: IntegrationTheme | null | undefined;
  appearanceOverride?: IntegrationAppearanceFormState | null;
}) {
  const defaults = buildIntegrationThemeDefaults({
    integrationName: input.integrationName,
    organizationName: input.organizationName,
  });
  const appearanceForm =
    input.appearanceOverride ??
    buildAppearanceFormState(input.theme, defaults);

  return {
    defaults,
    appearanceForm,
    appearance: resolveEmbedAppearanceFromForm(appearanceForm),
  };
}
