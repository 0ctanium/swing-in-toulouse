import {
  getThisWeekendWindow,
  getThisWeekWindow,
  getTodayWindow,
  type DateWindow,
} from "@/lib/event-collections/date-windows";
import { timePresetCollectionPath } from "@/lib/event-collections/urls";
import type { EventCollection } from "@/lib/event-collections/types";

type TimePresetDefinition = {
  slug: string;
  label: string;
  seoTitle: string;
  seoDescription: string;
  heroTitleBefore: string;
  heroTitleEmphasis: string;
  heroTitleAfter: string;
  emptyMessage: string;
  resolveWindow: () => DateWindow;
};

const TIME_PRESET_DEFINITIONS = [
  {
    slug: "aujourd-hui",
    label: "Aujourd'hui",
    seoTitle: "Événements swing aujourd'hui à Toulouse",
    seoDescription:
      "Soirées, cours et stages swing à Toulouse aujourd'hui : Lindy Hop, Balboa, Blues et plus.",
    heroTitleBefore: "Événements swing",
    heroTitleEmphasis: "aujourd'hui",
    heroTitleAfter: "à Toulouse",
    emptyMessage: "Aucun événement swing prévu aujourd'hui.",
    resolveWindow: getTodayWindow,
  },
  {
    slug: "ce-week-end",
    label: "Ce week-end",
    seoTitle: "Événements swing ce week-end à Toulouse",
    seoDescription:
      "Agenda du week-end swing à Toulouse : soirées, cours, pratiques et sorties du vendredi au dimanche.",
    heroTitleBefore: "Événements swing",
    heroTitleEmphasis: "ce week-end",
    heroTitleAfter: "à Toulouse",
    emptyMessage: "Aucun événement swing prévu ce week-end.",
    resolveWindow: getThisWeekendWindow,
  },
  {
    slug: "cette-semaine",
    label: "Cette semaine",
    seoTitle: "Événements swing cette semaine à Toulouse",
    seoDescription:
      "Agenda de la semaine swing à Toulouse : soirées, cours, pratiques et sorties du lundi au vendredi.",
    heroTitleBefore: "Événements swing",
    heroTitleEmphasis: "cette semaine",
    heroTitleAfter: "à Toulouse",
    emptyMessage: "Aucun événement swing prévu cette semaine.",
    resolveWindow: getThisWeekWindow,
  },
] as const satisfies readonly TimePresetDefinition[];

export type TimePresetSlug = (typeof TIME_PRESET_DEFINITIONS)[number]["slug"];

export const TIME_PRESET_SLUGS: TimePresetSlug[] = TIME_PRESET_DEFINITIONS.map(
  (preset) => preset.slug,
);

export function isTimePresetSlug(slug: string): slug is TimePresetSlug {
  return TIME_PRESET_SLUGS.includes(slug as TimePresetSlug);
}

export function listTimePresetDefinitions() {
  return TIME_PRESET_DEFINITIONS;
}

export function getTimePresetDefinition(slug: string) {
  return TIME_PRESET_DEFINITIONS.find((preset) => preset.slug === slug) ?? null;
}

export function timePresetToCollection(
  preset: TimePresetDefinition,
  window?: DateWindow,
): EventCollection {
  const resolvedWindow = window ?? preset.resolveWindow();

  return {
    kind: "time-preset",
    slug: preset.slug,
    path: timePresetCollectionPath(preset.slug),
    label: preset.label,
    subtitle: null,
    description: null,
    seoTitle: preset.seoTitle,
    seoDescription: preset.seoDescription,
    heroTitleBefore: preset.heroTitleBefore,
    heroTitleEmphasis: preset.heroTitleEmphasis,
    heroTitleAfter: preset.heroTitleAfter,
    filters: {
      from: resolvedWindow.from,
      to: resolvedWindow.to,
    },
  };
}

export function getTimePresetCollectionMeta(
  slug: string,
): EventCollection | null {
  const preset = getTimePresetDefinition(slug);

  if (!preset) {
    return null;
  }

  return {
    kind: "time-preset",
    slug: preset.slug,
    path: timePresetCollectionPath(preset.slug),
    label: preset.label,
    subtitle: null,
    description: null,
    seoTitle: preset.seoTitle,
    seoDescription: preset.seoDescription,
    heroTitleBefore: preset.heroTitleBefore,
    heroTitleEmphasis: preset.heroTitleEmphasis,
    heroTitleAfter: preset.heroTitleAfter,
    filters: {},
  };
}

export function getTimePresetEmptyMessage(slug: string) {
  return (
    getTimePresetDefinition(slug)?.emptyMessage ??
    "Aucun événement à venir pour le moment."
  );
}

export function getTimePresetCollection(slug: string): EventCollection | null {
  const preset = getTimePresetDefinition(slug);

  if (!preset) {
    return null;
  }

  return timePresetToCollection(preset);
}
