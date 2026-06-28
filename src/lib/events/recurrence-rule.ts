import { addDays, endOfDay, getDate, getISODay } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

import { siteConfig } from "@/lib/site";

const TIMEZONE = siteConfig.timezone;

export const ICAL_WEEKDAYS = [
  "MO",
  "TU",
  "WE",
  "TH",
  "FR",
  "SA",
  "SU",
] as const;

export type IcalWeekday = (typeof ICAL_WEEKDAYS)[number];

export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export type MonthlyMode = "day_of_month" | "nth_weekday";

export type RecurrenceEnd =
  | { type: "never" }
  | { type: "until"; date: string }
  | { type: "count"; count: number };

export type RecurrenceFormValue = {
  enabled: boolean;
  frequency: RecurrenceFrequency;
  interval: number;
  byWeekday: IcalWeekday[];
  monthlyMode: MonthlyMode;
  end: RecurrenceEnd;
};

export type RecurrencePreset =
  | "none"
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly_date"
  | "monthly_weekday"
  | "yearly";

const WEEKDAY_LABELS: Record<IcalWeekday, string> = {
  MO: "lundi",
  TU: "mardi",
  WE: "mercredi",
  TH: "jeudi",
  FR: "vendredi",
  SA: "samedi",
  SU: "dimanche",
};

const ORDINAL_LABELS: Record<number, string> = {
  1: "1er",
  2: "2e",
  3: "3e",
  4: "4e",
  5: "5e",
  [-1]: "dernier",
};

function weekdayFromAnchor(anchorStartAt: Date): IcalWeekday {
  const isoDay = getISODay(toZonedTime(anchorStartAt, TIMEZONE));
  return ICAL_WEEKDAYS[isoDay - 1];
}

function nthWeekdayFromAnchor(anchorStartAt: Date): {
  nth: number;
  weekday: IcalWeekday;
} {
  const zoned = toZonedTime(anchorStartAt, TIMEZONE);
  const weekday = weekdayFromAnchor(anchorStartAt);
  const dayOfMonth = getDate(zoned);
  const nth = Math.ceil(dayOfMonth / 7);
  const nextWeek = addDays(zoned, 7);

  return {
    nth: nextWeek.getMonth() !== zoned.getMonth() ? -1 : nth,
    weekday,
  };
}

function formatUntilValue(date: string, isAllDay: boolean): string {
  if (isAllDay) {
    return date.replace(/-/g, "");
  }

  const until = endOfDay(
    toZonedTime(`${date}T23:59:59`, TIMEZONE),
  );

  return formatInTimeZone(until, "UTC", "yyyyMMdd'T'HHmmss'Z'");
}

function parseRruleBody(stored: string | null | undefined): string | null {
  if (!stored) {
    return null;
  }

  for (const line of stored.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("RRULE:")) {
      return trimmed.slice("RRULE:".length);
    }

    if (trimmed.startsWith("FREQ=")) {
      return trimmed;
    }
  }

  return null;
}

function parseRruleParts(body: string): Map<string, string> {
  const parts = new Map<string, string>();

  for (const segment of body.split(";")) {
    const [key, ...rest] = segment.split("=");
    if (!key || rest.length === 0) {
      continue;
    }

    parts.set(key.toUpperCase(), rest.join("="));
  }

  return parts;
}

function parseByDayTokens(value: string): IcalWeekday[] {
  return value
    .split(",")
    .map((token) => token.replace(/^-?\d+/, "").toUpperCase())
    .filter((token): token is IcalWeekday =>
      ICAL_WEEKDAYS.includes(token as IcalWeekday),
    );
}

function hasNthWeekdayByDay(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  return value.split(",").some((token) => /^-?\d+[A-Z]{2}$/.test(token.trim()));
}

function parseUntilDate(value: string): string | null {
  const dateOnly = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!dateOnly) {
    return null;
  }

  return `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}`;
}

export function defaultRecurrenceFormValue(
  anchorStartAt = new Date(),
): RecurrenceFormValue {
  return {
    enabled: false,
    frequency: "weekly",
    interval: 1,
    byWeekday: [weekdayFromAnchor(anchorStartAt)],
    monthlyMode: "day_of_month",
    end: { type: "never" },
  };
}

export function recurrencePresetFromValue(
  value: RecurrenceFormValue,
): RecurrencePreset {
  if (!value.enabled) {
    return "none";
  }

  if (
    value.frequency === "daily" &&
    value.interval === 1 &&
    value.end.type === "never"
  ) {
    return "daily";
  }

  if (
    value.frequency === "weekly" &&
    value.interval === 1 &&
    value.end.type === "never"
  ) {
    return "weekly";
  }

  if (
    value.frequency === "weekly" &&
    value.interval === 2 &&
    value.end.type === "never"
  ) {
    return "biweekly";
  }

  if (
    value.frequency === "monthly" &&
    value.interval === 1 &&
    value.monthlyMode === "day_of_month" &&
    value.end.type === "never"
  ) {
    return "monthly_date";
  }

  if (
    value.frequency === "monthly" &&
    value.interval === 1 &&
    value.monthlyMode === "nth_weekday" &&
    value.end.type === "never"
  ) {
    return "monthly_weekday";
  }

  if (
    value.frequency === "yearly" &&
    value.interval === 1 &&
    value.end.type === "never"
  ) {
    return "yearly";
  }

  return "none";
}

export function resolveRecurrencePreset(
  value: RecurrenceFormValue,
): RecurrencePreset {
  const preset = recurrencePresetFromValue(value);
  if (preset !== "none" || !value.enabled) {
    return preset;
  }

  switch (value.frequency) {
    case "daily":
      return "daily";
    case "weekly":
      return value.interval === 2 ? "biweekly" : "weekly";
    case "monthly":
      return value.monthlyMode === "nth_weekday"
        ? "monthly_weekday"
        : "monthly_date";
    case "yearly":
      return "yearly";
    default:
      return "none";
  }
}

export function recurrenceValueFromPreset(
  preset: RecurrencePreset,
  anchorStartAt: Date,
  current: RecurrenceFormValue,
): RecurrenceFormValue {
  const anchorWeekday = weekdayFromAnchor(anchorStartAt);

  if (preset === "none") {
    return {
      ...current,
      enabled: false,
    };
  }

  const base: RecurrenceFormValue = {
    enabled: true,
    interval: 1,
    byWeekday: [anchorWeekday],
    monthlyMode: "day_of_month",
    end: current.end,
    frequency: "weekly",
  };

  switch (preset) {
    case "daily":
      return { ...base, frequency: "daily" };
    case "weekly":
      return { ...base, frequency: "weekly", interval: 1 };
    case "biweekly":
      return { ...base, frequency: "weekly", interval: 2 };
    case "monthly_date":
      return { ...base, frequency: "monthly", monthlyMode: "day_of_month" };
    case "monthly_weekday":
      return {
        ...base,
        frequency: "monthly",
        monthlyMode: "nth_weekday",
      };
    case "yearly":
      return { ...base, frequency: "yearly" };
    default:
      return current;
  }
}

export function buildRecurrenceRule(
  value: RecurrenceFormValue,
  anchorStartAt: Date,
  isAllDay: boolean,
): string | null {
  if (!value.enabled) {
    return null;
  }

  const parts = [`FREQ=${value.frequency.toUpperCase()}`];

  if (value.interval > 1) {
    parts.push(`INTERVAL=${value.interval}`);
  }

  if (value.frequency === "weekly") {
    const weekdays =
      value.byWeekday.length > 0
        ? value.byWeekday
        : [weekdayFromAnchor(anchorStartAt)];

    parts.push(`BYDAY=${weekdays.join(",")}`);
  }

  if (value.frequency === "monthly" && value.monthlyMode === "nth_weekday") {
    const { nth, weekday } = nthWeekdayFromAnchor(anchorStartAt);
    parts.push(`BYDAY=${nth}${weekday}`);
  }

  if (value.end.type === "until") {
    parts.push(`UNTIL=${formatUntilValue(value.end.date, isAllDay)}`);
  } else if (value.end.type === "count") {
    parts.push(`COUNT=${value.end.count}`);
  }

  return `RRULE:${parts.join(";")}`;
}

export function parseRecurrenceRule(
  stored: string | null | undefined,
  anchorStartAt: Date,
): RecurrenceFormValue {
  const body = parseRruleBody(stored);
  if (!body) {
    return defaultRecurrenceFormValue(anchorStartAt);
  }

  const parts = parseRruleParts(body);
  const freq = parts.get("FREQ")?.toLowerCase();

  if (
    freq !== "daily" &&
    freq !== "weekly" &&
    freq !== "monthly" &&
    freq !== "yearly"
  ) {
    return defaultRecurrenceFormValue(anchorStartAt);
  }

  const interval = Number.parseInt(parts.get("INTERVAL") ?? "1", 10);
  const byDay = parts.get("BYDAY");
  const count = parts.get("COUNT");
  const until = parts.get("UNTIL");

  let end: RecurrenceEnd = { type: "never" };
  if (count) {
    const parsedCount = Number.parseInt(count, 10);
    if (Number.isFinite(parsedCount) && parsedCount > 0) {
      end = { type: "count", count: parsedCount };
    }
  } else if (until) {
    const untilDate = parseUntilDate(until);
    if (untilDate) {
      end = { type: "until", date: untilDate };
    }
  }

  const monthlyMode: MonthlyMode = hasNthWeekdayByDay(byDay)
    ? "nth_weekday"
    : "day_of_month";

  return {
    enabled: true,
    frequency: freq,
    interval: Number.isFinite(interval) && interval > 0 ? interval : 1,
    byWeekday: byDay ? parseByDayTokens(byDay) : [weekdayFromAnchor(anchorStartAt)],
    monthlyMode,
    end,
  };
}

export function describeRecurrenceRule(
  value: RecurrenceFormValue,
  anchorStartAt: Date,
): string {
  if (!value.enabled) {
    return "Ne se répète pas";
  }

  let core = "";

  switch (value.frequency) {
    case "daily":
      core =
        value.interval === 1
          ? "Tous les jours"
          : `Tous les ${value.interval} jours`;
      break;
    case "weekly": {
      const weekdays =
        value.byWeekday.length > 0
          ? value.byWeekday
          : [weekdayFromAnchor(anchorStartAt)];
      const labels = weekdays.map((day) => WEEKDAY_LABELS[day]).join(", ");
      core =
        value.interval === 1
          ? `Toutes les semaines, le ${labels}`
          : `Toutes les ${value.interval} semaines, le ${labels}`;
      break;
    }
    case "monthly":
      if (value.monthlyMode === "nth_weekday") {
        const { nth, weekday } = nthWeekdayFromAnchor(anchorStartAt);
        const ordinal = ORDINAL_LABELS[nth] ?? `${nth}e`;
        core =
          value.interval === 1
            ? `Tous les mois, le ${ordinal} ${WEEKDAY_LABELS[weekday]}`
            : `Tous les ${value.interval} mois, le ${ordinal} ${WEEKDAY_LABELS[weekday]}`;
      } else {
        const day = getDate(toZonedTime(anchorStartAt, TIMEZONE));
        core =
          value.interval === 1
            ? `Tous les mois, le ${day}`
            : `Tous les ${value.interval} mois, le ${day}`;
      }
      break;
    case "yearly":
      core =
        value.interval === 1
          ? "Tous les ans"
          : `Tous les ${value.interval} ans`;
      break;
  }

  if (value.end.type === "until") {
    const formatted = formatInTimeZone(
      toZonedTime(`${value.end.date}T12:00:00`, TIMEZONE),
      TIMEZONE,
      "d MMMM yyyy",
    );
    return `${core}, jusqu'au ${formatted}`;
  }

  if (value.end.type === "count") {
    return `${core}, ${value.end.count} occurrence${value.end.count > 1 ? "s" : ""}`;
  }

  return core;
}
