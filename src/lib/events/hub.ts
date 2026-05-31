import { endOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import { siteConfig } from "@/lib/site";

export const EVENTS_HUB_PAGE_SIZE = 30;

/** How far back archive month links reach. */
export const EVENT_ARCHIVE_LOOKBACK_MONTHS = 36;

export type ArchiveMonth = {
  year: number;
  month: number;
  key: string;
};

export function buildArchiveMonthPath(year: number, month: number) {
  return `/evenements/${year}/${String(month).padStart(2, "0")}`;
}

export function parseArchiveMonthParams(year: string, month: string) {
  const yearNum = Number.parseInt(year, 10);
  const monthNum = Number.parseInt(month, 10);

  if (
    !Number.isInteger(yearNum) ||
    !Number.isInteger(monthNum) ||
    monthNum < 1 ||
    monthNum > 12
  ) {
    return null;
  }

  return { year: yearNum, month: monthNum };
}

export function getMonthWindowInSiteTimezone(year: number, month: number) {
  const monthPadded = String(month).padStart(2, "0");
  const from = fromZonedTime(
    `${year}-${monthPadded}-01T00:00:00`,
    siteConfig.timezone,
  );
  const lastDay = new Date(year, month, 0).getDate();
  const to = fromZonedTime(
    `${year}-${monthPadded}-${String(lastDay).padStart(2, "0")}T23:59:59.999`,
    siteConfig.timezone,
  );

  return { from, to };
}

export function formatArchiveMonthLabel(year: number, month: number) {
  const date = fromZonedTime(
    `${year}-${String(month).padStart(2, "0")}-01T12:00:00`,
    siteConfig.timezone,
  );

  return formatInTimeZone(date, siteConfig.timezone, "MMMM yyyy", {
    locale: fr,
  });
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const offset = (safePage - 1) * pageSize;

  return {
    items: items.slice(offset, offset + pageSize),
    page: safePage,
    totalPages,
    totalItems,
  };
}

export function buildPaginatedPath(basePath: string, page: number) {
  if (page <= 1) {
    return basePath;
  }

  const separator = basePath.includes("?") ? "&" : "?";
  return `${basePath}${separator}page=${page}`;
}

export function parsePageParam(
  value: string | string[] | undefined,
): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function getArchiveLookbackStart(from = new Date()) {
  return subMonths(
    fromZonedTime(
      `${formatInTimeZone(from, siteConfig.timezone, "yyyy-MM")}-01T00:00:00`,
      siteConfig.timezone,
    ),
    EVENT_ARCHIVE_LOOKBACK_MONTHS,
  );
}

export function getLastCompleteArchiveMonthEnd(from = new Date()) {
  return endOfMonth(
    subMonths(
      fromZonedTime(
        `${formatInTimeZone(from, siteConfig.timezone, "yyyy-MM")}-01T00:00:00`,
        siteConfig.timezone,
      ),
      1,
    ),
  );
}

export function collectArchiveMonthsFromOccurrences(
  occurrences: Array<{ startAt: Date }>,
  before: Date,
): ArchiveMonth[] {
  const monthKeys = new Set<string>();

  for (const occurrence of occurrences) {
    if (occurrence.startAt < before) {
      monthKeys.add(
        formatInTimeZone(occurrence.startAt, siteConfig.timezone, "yyyy-MM"),
      );
    }
  }

  return [...monthKeys]
    .sort((left, right) => right.localeCompare(left))
    .map((key) => {
      const [year, month] = key.split("-").map(Number);
      return { year, month, key };
    });
}
