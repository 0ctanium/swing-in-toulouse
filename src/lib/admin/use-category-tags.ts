import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { adminQueryKeys } from "@/lib/admin/query-keys";
import { fetchJson } from "@/lib/api/fetch-json";
import type { EventCategoryTag, EventCategoryTagType } from "@/db/schema";
import type { UpdateCategoryTagInput } from "@/lib/event-category-tags/schemas";

type UpdateCategoryTagMetadataInput = {
  name: string;
  tagType: EventCategoryTagType;
};

type UpdateCategoryTagPageInput = {
  name: string;
} & UpdateCategoryTagInput;

async function updateCategoryTagMetadata({
  name,
  tagType,
}: UpdateCategoryTagMetadataInput) {
  return fetchJson<{ tag: EventCategoryTag }>(
    "/api/admin/category-tags",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, tagType }),
    },
    "Enregistrement impossible.",
  );
}

async function updateCategoryTagPage({
  name,
  ...input
}: UpdateCategoryTagPageInput) {
  return fetchJson<{ tag: EventCategoryTag }>(
    "/api/admin/category-tags",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ...input }),
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

export function useUpdateCategoryTag() {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.categoryTags(), "page"],
    mutationFn: updateCategoryTagPage,
    onSuccess: () => {
      router.refresh();
    },
  });
}
