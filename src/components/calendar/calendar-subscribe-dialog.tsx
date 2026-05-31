"use client";

import React, { useMemo, type ReactElement, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  calendarSubscribeHandle,
  type CalendarSubscribeOpenPayload,
} from "@/lib/calendar-subscribe-handle";
import type { IcalPayload } from "@/lib/ical/payload";

type CalendarSubscribeDialogProps = {
  payload: IcalPayload;
  feedName?: string;
  title?: string;
  description?: string;
  children?: ReactNode;
};

type ClickableChild = ReactElement<{
  onClick?: React.MouseEventHandler<HTMLElement>;
}>;

function openCalendarSubscribeDialog(openPayload: CalendarSubscribeOpenPayload) {
  calendarSubscribeHandle.openWithPayload(openPayload);
}

function withCalendarSubscribeClick(
  child: ClickableChild,
  openPayload: CalendarSubscribeOpenPayload,
) {
  return React.cloneElement(child, {
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      openCalendarSubscribeDialog(openPayload);
      child.props.onClick?.(event);
    },
  });
}

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

  if (children && React.isValidElement(children)) {
    return withCalendarSubscribeClick(children as ClickableChild, openPayload);
  }

  return (
    <Button variant="outline" onClick={() => openCalendarSubscribeDialog(openPayload)}>
      S&apos;abonner au calendrier
    </Button>
  );
}
