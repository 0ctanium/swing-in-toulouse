"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";

import { Label } from "@/components/ui/label";
import {
  buildScheduleIso,
  type EventScheduleValue,
} from "@/lib/events/manual-event-schedule";
import {
  describeRecurrenceRule,
  ICAL_WEEKDAYS,
  type IcalWeekday,
  type RecurrenceEnd,
  type RecurrenceFormValue,
  type RecurrencePreset,
  resolveRecurrencePreset,
  recurrenceValueFromPreset,
  defaultRecurrenceFormValue,
} from "@/lib/events/recurrence-rule";
import { WEEKDAY_LABELS_COMPACT } from "@/lib/events/calendar";
import { cn } from "@/lib/utils";

type EventRecurrenceInputProps = {
  value: RecurrenceFormValue;
  onChange: (value: RecurrenceFormValue) => void;
  schedule: EventScheduleValue;
  disabled?: boolean;
};

const PRESET_OPTIONS: Array<{ value: RecurrencePreset; label: string }> = [
  { value: "none", label: "Ne se répète pas" },
  { value: "daily", label: "Tous les jours" },
  { value: "weekly", label: "Toutes les semaines" },
  { value: "biweekly", label: "Toutes les 2 semaines" },
  { value: "monthly_date", label: "Tous les mois (même date)" },
  {
    value: "monthly_weekday",
    label: "Tous les mois (même jour de la semaine)",
  },
  { value: "yearly", label: "Tous les ans" },
];

const INPUT_CLASS =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm";

function toggleWeekday(
  current: IcalWeekday[],
  weekday: IcalWeekday,
): IcalWeekday[] {
  if (current.includes(weekday)) {
    const next = current.filter((day) => day !== weekday);
    return next.length > 0 ? next : current;
  }

  return [...current, weekday].sort(
    (left, right) =>
      ICAL_WEEKDAYS.indexOf(left) - ICAL_WEEKDAYS.indexOf(right),
  );
}

export function EventRecurrenceInput({
  value,
  onChange,
  schedule,
  disabled = false,
}: EventRecurrenceInputProps) {
  const [preview, setPreview] = useState<
    Array<{ startAt: string; endAt: string | null }>
  >([]);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const anchorStartAt = useMemo(() => {
    try {
      return new Date(buildScheduleIso(schedule).startAt);
    } catch {
      return new Date();
    }
  }, [schedule]);

  const selectedPreset = resolveRecurrencePreset(value);
  const summary = describeRecurrenceRule(value, anchorStartAt);
  const showWeekdayPicker = value.enabled && value.frequency === "weekly";

  useEffect(() => {
    if (!value.enabled) {
      setPreview([]);
      setPreviewError(null);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      try {
        const scheduleIso = buildScheduleIso(schedule);
        const response = await fetch("/api/admin/events/recurrence-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startAt: scheduleIso.startAt,
            endAt: scheduleIso.endAt,
            isAllDay: scheduleIso.isAllDay,
            recurrence: value,
          }),
        });

        if (!response.ok) {
          throw new Error("Aperçu indisponible.");
        }

        const body = (await response.json()) as {
          occurrences: Array<{ startAt: string; endAt: string | null }>;
        };

        if (!cancelled) {
          setPreview(body.occurrences);
          setPreviewError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setPreview([]);
          setPreviewError(
            error instanceof Error ? error.message : "Aperçu indisponible.",
          );
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [schedule, value]);

  function handlePresetChange(preset: RecurrencePreset) {
    onChange(recurrenceValueFromPreset(preset, anchorStartAt, value));
  }

  function handleEndChange(end: RecurrenceEnd) {
    onChange({ ...value, end });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="event-recurrence-preset">Répétition</Label>
        <select
          id="event-recurrence-preset"
          className={INPUT_CLASS}
          disabled={disabled}
          value={selectedPreset}
          onChange={(event) =>
            handlePresetChange(event.target.value as RecurrencePreset)
          }
        >
          {PRESET_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {value.enabled ? (
          <p className="text-muted-foreground text-sm">{summary}</p>
        ) : null}
      </div>

      {showWeekdayPicker ? (
        <div className="flex flex-col gap-2">
          <Label>Jours de la semaine</Label>
          <div className="flex flex-wrap gap-2">
            {ICAL_WEEKDAYS.map((weekday, index) => {
              const selected = value.byWeekday.includes(weekday);

              return (
                <button
                  key={weekday}
                  type="button"
                  disabled={disabled}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted",
                  )}
                  aria-pressed={selected}
                  onClick={() =>
                    onChange({
                      ...value,
                      byWeekday: toggleWeekday(value.byWeekday, weekday),
                    })
                  }
                >
                  {WEEKDAY_LABELS_COMPACT[index]}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {value.enabled ? (
        <div className="flex flex-col gap-3 rounded-lg border p-4">
          <Label>Fin de la répétition</Label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="recurrence-end"
              disabled={disabled}
              checked={value.end.type === "never"}
              onChange={() => handleEndChange({ type: "never" })}
            />
            Jamais
          </label>
          <label className="flex flex-wrap items-center gap-2 text-sm">
            <input
              type="radio"
              name="recurrence-end"
              disabled={disabled}
              checked={value.end.type === "until"}
              onChange={() =>
                handleEndChange({
                  type: "until",
                  date: schedule.startDate,
                })
              }
            />
            Le
            <input
              type="date"
              className="rounded-lg border bg-background px-2 py-1 text-sm"
              disabled={disabled || value.end.type !== "until"}
              value={value.end.type === "until" ? value.end.date : schedule.startDate}
              onChange={(event) =>
                handleEndChange({ type: "until", date: event.target.value })
              }
            />
          </label>
          <label className="flex flex-wrap items-center gap-2 text-sm">
            <input
              type="radio"
              name="recurrence-end"
              disabled={disabled}
              checked={value.end.type === "count"}
              onChange={() =>
                handleEndChange({
                  type: "count",
                  count: 10,
                })
              }
            />
            Après
            <input
              type="number"
              min={1}
              max={999}
              className="w-20 rounded-lg border bg-background px-2 py-1 text-sm"
              disabled={disabled || value.end.type !== "count"}
              value={value.end.type === "count" ? value.end.count : 10}
              onChange={(event) =>
                handleEndChange({
                  type: "count",
                  count: Number.parseInt(event.target.value, 10) || 1,
                })
              }
            />
            occurrences
          </label>
        </div>
      ) : null}

      {value.enabled ? (
        <div className="flex flex-col gap-2">
          <Label>Prochaines dates</Label>
          {previewError ? (
            <p className="text-muted-foreground text-sm">{previewError}</p>
          ) : preview.length > 0 ? (
            <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
              {preview.map((occurrence) => (
                <li key={occurrence.startAt}>
                  {format(new Date(occurrence.startAt), "EEEE d MMMM yyyy · HH:mm", {
                    locale: fr,
                  })}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">
              Aucune occurrence dans la fenêtre de projection.
            </p>
          )}
          <p className="text-muted-foreground text-xs">
            Les exceptions (date masquée ou modifiée) se gèrent après
            enregistrement, dans le calendrier des occurrences.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export { defaultRecurrenceFormValue };
