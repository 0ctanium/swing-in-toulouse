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

const sourceBaseWriteSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis."),
  slug: slugSchema.optional(),
  organizationId: z
    .string()
    .uuid("Organisateur invalide.")
    .nullable()
    .optional(),
  defaultLocationRaw: z.string().trim().nullable().optional(),
  defaultCategories: z.array(z.string()).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const sourceIcalWriteSchema = sourceBaseWriteSchema.extend({
  type: z.literal("ical").default("ical"),
  url: z.string().trim().url("URL iCal invalide."),
});

export const sourceWriteSchema = sourceIcalWriteSchema;

export const sourcePatchSchema = sourceBaseWriteSchema
  .extend({
    url: z.string().trim().url("URL iCal invalide.").optional(),
  })
  .partial();

export type SourceIcalWriteInput = z.infer<typeof sourceIcalWriteSchema>;
export type SourceWriteInput = SourceIcalWriteInput;
export type SourcePatchInput = z.infer<typeof sourcePatchSchema>;

export type SourceSyncStats = {
  created: number;
  updated: number;
  unchanged: number;
  cancelled: number;
};

export type SourceSyncResult =
  | SourceSyncStats
  | {
      error: string;
    };

export function parseSourceFormFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const organizationIdRaw = String(formData.get("organizationId") ?? "").trim();
  const defaultCategoriesRaw = String(
    formData.get("defaultCategories") ?? "",
  ).trim();
  const defaultLocationRaw = String(
    formData.get("defaultLocationRaw") ?? "",
  ).trim();
  const isActiveRaw = String(formData.get("isActive") ?? "true");

  return {
    name,
    slug: slug || undefined,
    organizationId: organizationIdRaw || null,
    defaultLocationRaw: defaultLocationRaw || null,
    defaultCategories: defaultCategoriesRaw
      ? parseSourceCategoriesInput(defaultCategoriesRaw)
      : undefined,
    isActive: isActiveRaw !== "false",
  };
}
