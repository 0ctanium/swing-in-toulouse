import { z } from "zod";

import { organizationCategoryValues } from "@/lib/organizations/categories";
import { organizationDanceValues } from "@/lib/organizations/dances";
import { organizationSocialPlatformValues } from "@/lib/organizations/social-links";

export { normalizeOrganizationWebsite } from "@/lib/organizations/urls";

const slugSchema = z
  .string()
  .trim()
  .min(1, "Le slug est requis.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug invalide (lettres minuscules, chiffres et tirets).",
  );

const organizationSocialLinksSchema = z
  .object(
    Object.fromEntries(
      organizationSocialPlatformValues.map((platform) => [
        platform,
        z.string().trim().nullable().optional(),
      ]),
    ),
  )
  .nullable()
  .optional();

export const organizationWriteSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  slug: slugSchema.optional(),
  description: z.string().trim().nullable().optional(),
  website: z.string().trim().nullable().optional(),
  category: z.enum(organizationCategoryValues).nullable().optional(),
  dances: z
    .array(z.enum(organizationDanceValues))
    .nullable()
    .optional(),
  socialLinks: organizationSocialLinksSchema,
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
