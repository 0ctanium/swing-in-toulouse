"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { EventScheduleValue } from "@/lib/events/manual-event-schedule";

const INPUT_CLASS =
  "h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm";

type EventScheduleInputProps = {
  value: EventScheduleValue;
  onChange: (value: EventScheduleValue) => void;
  disabled?: boolean;
};

export function EventScheduleInput({
  value,
  onChange,
  disabled = false,
}: EventScheduleInputProps) {
  function update(partial: Partial<EventScheduleValue>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="event-is-all-day">Jour entier</Label>
          <span className="text-muted-foreground text-xs">
            Sans horaire précis (fuseau Europe/Paris).
          </span>
        </div>
        <Switch
          id="event-is-all-day"
          checked={value.isAllDay}
          disabled={disabled}
          onCheckedChange={(checked) => update({ isAllDay: checked })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="event-start-date">Date de début</Label>
          <input
            id="event-start-date"
            type="date"
            className={INPUT_CLASS}
            value={value.startDate}
            disabled={disabled}
            onChange={(event) => {
              const startDate = event.target.value;
              update({
                startDate,
                endDate:
                  !value.endDate || value.endDate < startDate
                    ? startDate
                    : value.endDate,
              });
            }}
          />
        </div>

        {!value.isAllDay ? (
          <div className="flex flex-col gap-1">
            <Label htmlFor="event-start-time">Heure de début</Label>
            <input
              id="event-start-time"
              type="time"
              className={INPUT_CLASS}
              value={value.startTime}
              disabled={disabled}
              onChange={(event) => update({ startTime: event.target.value })}
            />
          </div>
        ) : null}

        <div className="flex flex-col gap-1">
          <Label htmlFor="event-end-date">
            {value.isAllDay ? "Date de fin (incluse)" : "Date de fin"}
          </Label>
          <input
            id="event-end-date"
            type="date"
            className={INPUT_CLASS}
            value={value.endDate}
            min={value.startDate}
            disabled={disabled}
            onChange={(event) => update({ endDate: event.target.value })}
          />
        </div>

        {!value.isAllDay ? (
          <div className="flex flex-col gap-1">
            <Label htmlFor="event-end-time">Heure de fin</Label>
            <input
              id="event-end-time"
              type="time"
              className={INPUT_CLASS}
              value={value.endTime}
              disabled={disabled}
              onChange={(event) => update({ endTime: event.target.value })}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
