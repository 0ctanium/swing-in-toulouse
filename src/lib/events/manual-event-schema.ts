import { z } from "zod";

import { eventOfferSchema } from "@/lib/events/offers";
import { buildRecurrenceRule } from "@/lib/events/recurrence-rule";

function normalizeOptionalUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeCategories(categories: string[] | null | undefined) {
  if (!categories) {
    return null;
  }

  const normalized = categories.map((item) => item.trim()).filter(Boolean);
  return normalized.length > 0 ? normalized : null;
}

export const recurrenceEndSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("never") }),
  z.object({
    type: z.literal("until"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  z.object({
    type: z.literal("count"),
    count: z.number().int().min(1).max(999),
  }),
]);

export const recurrenceFormSchema = z.object({
  enabled: z.boolean(),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  interval: z.number().int().min(1).max(99),
  byWeekday: z.array(z.enum(["MO", "TU", "WE", "TH", "FR", "SA", "SU"])),
  monthlyMode: z.enum(["day_of_month", "nth_weekday"]),
  end: recurrenceEndSchema,
});

export const manualEventWriteSchema = z
  .object({
    title: z.string().trim().min(1, "Le titre est requis."),
    description: z.string().nullable().optional(),
    startAt: z.string().datetime(),
    endAt: z.string().datetime().nullable().optional(),
    isAllDay: z.boolean().default(false),
    organizationId: z.string().uuid().nullable().optional(),
    venueId: z.string().uuid().nullable().optional(),
    categories: z.array(z.string()).nullable().optional(),
    status: z.enum(["published", "cancelled"]).default("published"),
    sourceUrl: z.string().nullable().optional(),
    offers: z.array(eventOfferSchema).nullable().optional(),
    notes: z.string().nullable().optional(),
    recurrence: recurrenceFormSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.endAt) {
      const startAt = new Date(value.startAt);
      const endAt = new Date(value.endAt);

      if (endAt < startAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La fin doit être postérieure au début.",
          path: ["endAt"],
        });
      }
    }
  })
  .transform((value) => {
    const startAt = new Date(value.startAt);

    return {
      ...value,
      title: value.title.trim(),
      description: value.description?.trim() || null,
      organizationId: value.organizationId ?? null,
      venueId: value.venueId ?? null,
      categories: normalizeCategories(value.categories),
      sourceUrl: normalizeOptionalUrl(value.sourceUrl),
      notes: value.notes?.trim() || null,
      recurrenceRule:
        value.recurrence !== undefined
          ? buildRecurrenceRule(value.recurrence, startAt, value.isAllDay)
          : undefined,
    };
  });

export type ManualEventWriteInput = z.infer<typeof manualEventWriteSchema>;
