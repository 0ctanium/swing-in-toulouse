import { z } from "zod";

export const eventOverridePatchSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().nullable().optional(),
    isAllDay: z.boolean().optional(),
    locationRaw: z.string().nullable().optional(),
    venueId: z.string().uuid().nullable().optional(),
    organizationId: z.string().uuid().nullable().optional(),
    categories: z.array(z.string()).nullable().optional(),
    status: z.enum(["published", "cancelled"]).optional(),
    sourceUrl: z.string().url().nullable().optional(),
    hidden: z.boolean().optional(),
    notes: z.string().nullable().optional(),
  })
  .strict();

export type EventOverridePatch = z.infer<typeof eventOverridePatchSchema>;

export type OverrideScope = "master" | "occurrence";

export function occurrenceOverrideKey(startAt: Date) {
  return startAt.toISOString();
}
