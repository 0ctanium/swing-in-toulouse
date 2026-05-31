import { format } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { fr } from "date-fns/locale";

import { ScheduleEventRow } from "@/components/events/schedule-event-row";
import { groupEventsByDay } from "@/lib/events/calendar";
import type { EventOccurrence } from "@/lib/events/queries";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type CompactPlanningViewProps = {
  events: EventOccurrence[];
  emptyMessage?: string;
};

function isTodayInSiteTimezone(date: Date) {
  const todayKey = formatInTimeZone(new Date(), siteConfig.timezone, "yyyy-MM-dd");
  const dateKey = formatInTimeZone(date, siteConfig.timezone, "yyyy-MM-dd");

  return todayKey === dateKey;
}

type ScheduleDateLabelProps = {
  date: Date;
};

function ScheduleDateLabel({ date }: ScheduleDateLabelProps) {
  const zonedDate = toZonedTime(date, siteConfig.timezone);
  const today = isTodayInSiteTimezone(date);
  const dayNumber = format(zonedDate, "d", { locale: fr });
  const monthAndWeekday = format(zonedDate, "MMM, EEE", { locale: fr }).replace(
    /\./g,
    "",
  );

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-0.5 pt-0.5 text-center",
        today && "text-primary",
      )}
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center text-2xl font-normal tabular-nums",
          today && "rounded-full bg-primary font-medium text-primary-foreground",
        )}
      >
        {dayNumber}
      </span>
      <span className="text-[11px] font-medium tracking-wide uppercase">
        {monthAndWeekday}
      </span>
    </div>
  );
}

type ScheduleDayGroupProps = {
  dayKey: string;
  events: EventOccurrence[];
};

function ScheduleDayGroup({ dayKey, events }: ScheduleDayGroupProps) {
  const date = new Date(`${dayKey}T12:00:00`);

  return (
    <div className="flex border-b border-border/70 last:border-b-0">
      <div className="w-20 shrink-0 border-r border-border/70 px-2 py-3 sm:w-24 sm:px-3">
        <ScheduleDateLabel date={date} />
      </div>
      <div className="min-w-0 flex-1 divide-y divide-border/70">
        {events.map((event) => (
          <ScheduleEventRow key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

export function CompactPlanningView({
  events,
  emptyMessage = "Aucun événement à venir pour le moment.",
}: CompactPlanningViewProps) {
  if (events.length === 0) {
    return <p className="text-muted-foreground text-sm">{emptyMessage}</p>;
  }

  const eventsByDay = groupEventsByDay(events);
  const dayKeys = [...eventsByDay.keys()].sort();

  return (
    <div className="overflow-hidden rounded-xl border bg-muted/35">
      {dayKeys.map((dayKey) => (
        <ScheduleDayGroup
          key={dayKey}
          dayKey={dayKey}
          events={eventsByDay.get(dayKey) ?? []}
        />
      ))}
    </div>
  );
}
