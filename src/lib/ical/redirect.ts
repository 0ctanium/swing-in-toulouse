import { NextResponse } from "next/server";

import {
  buildIcalFeedPath,
  emptyIcalPayload,
  type IcalPayload,
} from "@/lib/ical/payload";

export function icalFeedRedirect(
  request: Request,
  filters: IcalPayload = emptyIcalPayload(),
) {
  return NextResponse.redirect(
    new URL(buildIcalFeedPath(filters), request.url),
    307,
  );
}
