"use client";

import { Dialog } from "@/components/ui/dialog";
import { CalendarSubscribeDialogContent } from "@/components/calendar/calendar-subscribe-dialog-content";
import {
  calendarSubscribeHandle,
  CalendarSubscribeOpenPayload,
} from "@/lib/calendar-subscribe-handle";

export function CalendarSubscribeDialogRoot() {
  return (
    <Dialog handle={calendarSubscribeHandle}>
      {(props) => {
        const { payload } = props as { payload: CalendarSubscribeOpenPayload };

        if (!payload?.payload) {
          return null;
        }

        return <CalendarSubscribeDialogContent {...payload} />;
      }}
    </Dialog>
  );
}
