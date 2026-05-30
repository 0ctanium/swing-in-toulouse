import { z } from "zod";

import { venueCategoryValues } from "@/lib/venues/categories";

const slugSchema = z
  .string()
  .trim()
  .min(1, "Le slug est requis.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug invalide (lettres minuscules, chiffres et tirets).",
  );

export const venueWriteSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  slug: slugSchema.optional(),
  address: z.string().trim().nullable().optional(),
  city: z.string().trim().min(1, "La ville est requise."),
  category: z.enum(venueCategoryValues).nullable().optional(),
});

export type VenueWriteInput = z.infer<typeof venueWriteSchema>;
