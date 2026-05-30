import { z } from "zod";

import { organizationCategoryValues } from "@/lib/organizations/categories";

export function normalizeOrganizationWebsite(
  value: string | null | undefined,
) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(
      trimmed.includes("://") ? trimmed : `https://${trimmed}`,
    );
    return url.toString();
  } catch {
    return trimmed;
  }
}

const slugSchema = z
  .string()
  .trim()
  .min(1, "Le slug est requis.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug invalide (lettres minuscules, chiffres et tirets).",
  );

export const organizationWriteSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  slug: slugSchema.optional(),
  description: z.string().trim().nullable().optional(),
  website: z.string().trim().nullable().optional(),
  category: z.enum(organizationCategoryValues).nullable().optional(),
  venueId: z
    .string()
    .uuid("Le lieu sélectionné est invalide.")
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

export const organizationPatchSchema = organizationWriteSchema.partial();

export type OrganizationWriteInput = z.infer<typeof organizationWriteSchema>;
export type OrganizationPatchInput = z.infer<typeof organizationPatchSchema>;
