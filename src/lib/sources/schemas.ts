import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(1, "Le slug est requis.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug invalide (lettres minuscules, chiffres et tirets).",
  );

export function normalizeSourceCategories(
  categories: string[] | null | undefined,
) {
  if (categories === null) {
    return null;
  }

  if (!categories) {
    return undefined;
  }

  const normalized = categories
    .map((category) => category.trim())
    .filter(Boolean);

  return normalized.length > 0 ? normalized : null;
}

export function parseSourceCategoriesInput(value: string) {
  return value
    .split(",")
    .map((category) => category.trim())
    .filter(Boolean);
}

export const sourceWriteSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  slug: slugSchema.optional(),
  url: z.string().trim().url("URL iCal invalide."),
  organizationId: z
    .string()
    .uuid("Organisateur invalide.")
    .nullable()
    .optional(),
  defaultLocationRaw: z.string().trim().nullable().optional(),
  defaultCategories: z.array(z.string()).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const sourcePatchSchema = sourceWriteSchema.partial();

export type SourceWriteInput = z.infer<typeof sourceWriteSchema>;
export type SourcePatchInput = z.infer<typeof sourcePatchSchema>;
