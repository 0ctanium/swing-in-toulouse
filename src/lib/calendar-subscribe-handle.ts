import { Dialog } from "@base-ui/react/dialog";

import type { IcalPayload } from "@/lib/ical/payload";

export type CalendarSubscribeOpenPayload = {
  payload: IcalPayload;
  feedName?: string;
  title?: string;
  description?: string;
};

export const calendarSubscribeHandle =
  Dialog.createHandle<CalendarSubscribeOpenPayload>();
