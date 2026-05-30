import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { fetchJson } from "@/lib/api/fetch-json";
import { adminQueryKeys } from "@/lib/admin/query-keys";
import type { Source } from "@/db/schema";

type UpdateSourceDefaultsInput = {
  defaultLocationRaw: string | null;
  defaultCategories: string[] | null;
};

async function updateSourceDefaults(
  sourceId: string,
  input: UpdateSourceDefaultsInput,
) {
  return fetchJson<{ source: Source }>(
    `/api/admin/sources/${sourceId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Enregistrement impossible.",
  );
}

export function useUpdateSourceDefaults(sourceId: string) {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.source(sourceId), "defaults"],
    mutationFn: (input: UpdateSourceDefaultsInput) =>
      updateSourceDefaults(sourceId, input),
    onSuccess: () => {
      router.refresh();
    },
  });
}
