import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { adminQueryKeys } from "@/lib/admin/query-keys";
import { fetchJson } from "@/lib/api/fetch-json";
import type { EventCategoryTagType } from "@/db/schema";
import type { EventCategoryTag } from "@/db/schema";

type UpdateCategoryTagMetadataInput = {
  name: string;
  tagType: EventCategoryTagType;
};

async function updateCategoryTagMetadata({
  name,
  tagType,
}: UpdateCategoryTagMetadataInput) {
  return fetchJson<{ tag: EventCategoryTag }>(
    `/api/admin/category-tags/${encodeURIComponent(name)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagType }),
    },
    "Enregistrement impossible.",
  );
}

export function useUpdateCategoryTagMetadata() {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.categoryTags(), "metadata"],
    mutationFn: updateCategoryTagMetadata,
    onSuccess: () => {
      router.refresh();
    },
  });
}
