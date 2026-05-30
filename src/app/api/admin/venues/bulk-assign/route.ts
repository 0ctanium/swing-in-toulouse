import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { assertAdminApi } from "@/lib/admin/auth";
import { summarizeDebug, venueMatchingLog } from "@/lib/venues/matching-debug";
import {
  bulkAssignVenue,
  findEventsForVenueAssignment,
  VenueMatchingError,
} from "@/lib/venues/matching";

const assignmentSchema = z.object({
  sourceVenueId: z.string().uuid(),
  permanent: z.boolean().optional(),
});

const bodySchema = z.object({
  targetVenueId: z.string().uuid(),
  assignments: z.array(assignmentSchema).optional(),
  sourceVenueIds: z.array(z.string().uuid()).optional(),
  locationKey: z.string().min(1).optional(),
  locationKeys: z.array(z.string().min(1)).optional(),
  eventIds: z.array(z.string().uuid()).optional(),
  dryRun: z.boolean().optional(),
  debug: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const authError = await assertAdminApi(request);
  if (authError) {
    return authError;
  }

  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    venueMatchingLog("bulk-assign invalid body", parsed.error.flatten());
    return NextResponse.json(
      { error: "Corps de requête invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { dryRun, debug = true, ...filter } = parsed.data;

  venueMatchingLog("bulk-assign request", { dryRun, debug, filter });

  try {
    if (dryRun) {
      const { events, debug: assignmentDebug } =
        await findEventsForVenueAssignment({ ...filter, debug });

      const response = {
        matched: events.length,
        updated: 0,
        skipped: 0,
        eventIds: events.map((event) => event.id),
        debug: assignmentDebug
          ? summarizeDebug(assignmentDebug)
          : undefined,
      };

      venueMatchingLog("bulk-assign dry-run response", response);
      return NextResponse.json(response);
    }

    const result = await bulkAssignVenue({ ...filter, debug });
    const response = {
      ...result,
      debug: result.debug ? summarizeDebug(result.debug) : undefined,
    };

    venueMatchingLog("bulk-assign response", {
      matched: response.matched,
      updated: response.updated,
      debug: response.debug,
    });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof VenueMatchingError) {
      venueMatchingLog("bulk-assign error", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    venueMatchingLog("bulk-assign unexpected error", error);
    throw error;
  }
}
