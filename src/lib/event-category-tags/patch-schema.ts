import { z } from "zod";

import { updateCategoryTagSchema } from "@/lib/event-category-tags/schemas";

export const patchCategoryTagRequestSchema = updateCategoryTagSchema.extend({
  name: z.string().trim().min(1),
});

export type PatchCategoryTagRequest = z.infer<typeof patchCategoryTagRequestSchema>;
