"use client";

import React, { useMemo, type ReactNode } from "react";

import {
  calendarSubscribeHandle,
  type CalendarSubscribeOpenPayload,
} from "@/lib/calendar-subscribe-handle";
import type { IcalPayload } from "@/lib/ical/payload";
import { DialogTrigger } from "../ui/dialog";
import { useRender } from "@base-ui/react";

type CalendarSubscribeDialogProps = {
  payload: IcalPayload;
  feedName?: string;
  title?: string;
  description?: string;
  children?: ReactNode;
};

export function CalendarSubscribeDialog({
  payload,
  feedName,
  title,
  description,
  children,
}: CalendarSubscribeDialogProps) {
  const openPayload = useMemo<CalendarSubscribeOpenPayload>(
    () => ({
      payload,
      feedName,
      title,
      description,
    }),
    [description, feedName, payload, title],
  );

  if (!children || !React.isValidElement(children)) {
    return null;
  }

  return (
    <DialogTrigger
      handle={calendarSubscribeHandle}
      payload={openPayload}
      render={children}
    />
  );
}
