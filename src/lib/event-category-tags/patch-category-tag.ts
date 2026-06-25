import { NextResponse } from "next/server";

import { invalidateCategoryTagMetadataCache } from "@/lib/cache/invalidate";
import { updateCategoryTag } from "@/lib/event-category-tags/admin";
import type { UpdateCategoryTagInput } from "@/lib/event-category-tags/schemas";

export async function patchCategoryTagResponse(
  name: string,
  input: UpdateCategoryTagInput,
) {
  if (Object.keys(input).length === 0) {
    return NextResponse.json(
      { error: "Aucune modification fournie." },
      { status: 400 },
    );
  }

  try {
    const tag = await updateCategoryTag(name, input);
    invalidateCategoryTagMetadataCache();

    return NextResponse.json({ tag });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Enregistrement impossible.",
      },
      { status: 400 },
    );
  }
}
