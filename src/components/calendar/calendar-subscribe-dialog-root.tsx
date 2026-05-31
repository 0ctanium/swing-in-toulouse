"use client";

import { Dialog } from "@/components/ui/dialog";
import { CalendarSubscribeDialogContent } from "@/components/calendar/calendar-subscribe-dialog-content";
import { calendarSubscribeHandle } from "@/lib/calendar-subscribe-handle";

export function CalendarSubscribeDialogRoot() {
  return (
    <Dialog handle={calendarSubscribeHandle}>
      {({ payload: openConfig }) =>
        openConfig?.payload ? (
          <CalendarSubscribeDialogContent {...openConfig} />
        ) : null
      }
    </Dialog>
  );
}
