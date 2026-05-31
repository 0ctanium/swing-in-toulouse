import { z } from "zod";

import { eventCategoryTagTypeValues } from "@/lib/event-category-tags/tag-types";

export const eventCategoryTagMetadataSchema = z.object({
  tagType: z.enum(eventCategoryTagTypeValues),
});
