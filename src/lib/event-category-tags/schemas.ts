import { z } from "zod";

import { eventCategoryTagTypeValues } from "@/lib/event-category-tags/tag-types";
import { categoryTagSlugPattern } from "@/lib/slug";

const nullableTrimmedString = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .optional();

export const eventCategoryTagMetadataSchema = z.object({
  tagType: z.enum(eventCategoryTagTypeValues),
});

const nullableShortString = z
  .string()
  .trim()
  .max(120)
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .optional();

export const updateCategoryTagSchema = z
  .object({
    tagType: z.enum(eventCategoryTagTypeValues).optional(),
    aliases: z
      .array(
        z
          .string()
          .trim()
          .min(1, "Alias vide.")
          .max(80, "Alias trop long (80 caractères max)."),
      )
      .max(20, "20 alias maximum.")
      .optional(),
    slug: nullableTrimmedString,
    subtitle: z
      .string()
      .trim()
      .max(200)
      .transform((value) => (value.length === 0 ? null : value))
      .nullable()
      .optional(),
    description: z
      .string()
      .trim()
      .max(10_000)
      .transform((value) => (value.length === 0 ? null : value))
      .nullable()
      .optional(),
    heroTitleBefore: nullableShortString,
    heroTitleEmphasis: nullableShortString,
    heroTitleAfter: nullableShortString,
    seoTitle: z
      .string()
      .trim()
      .max(120)
      .transform((value) => (value.length === 0 ? null : value))
      .nullable()
      .optional(),
    seoDescription: z
      .string()
      .trim()
      .max(320)
      .transform((value) => (value.length === 0 ? null : value))
      .nullable()
      .optional(),
    isPublished: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.slug && !categoryTagSlugPattern.test(data.slug)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets.",
        path: ["slug"],
      });
    }
  });

export type UpdateCategoryTagInput = z.infer<typeof updateCategoryTagSchema>;
