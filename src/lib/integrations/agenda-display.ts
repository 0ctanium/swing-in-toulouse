import {
  mergeAgendaDisplayConfig,
  type AgendaDisplayConfig,
} from "@/lib/events/agenda-display-config";
import {
  getThemeAgendaConfig,
  type IntegrationTheme,
} from "@/lib/integrations/theme";

export function getIntegrationAgendaDisplayConfig(
  theme: IntegrationTheme | null | undefined,
): AgendaDisplayConfig {
  return mergeAgendaDisplayConfig(getThemeAgendaConfig(theme));
}
