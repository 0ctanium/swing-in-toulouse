import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { fetchJson, fetchJsonVoid } from "@/lib/api/fetch-json";
import { adminQueryKeys } from "@/lib/admin/query-keys";
import type {
  SourcePatchInput,
  SourceWriteInput,
} from "@/lib/sources/schemas";

async function createSource(input: SourceWriteInput) {
  return fetchJson(
    "/api/admin/sources",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Création impossible.",
  );
}

async function updateSource(sourceId: string, input: SourcePatchInput) {
  return fetchJson(
    `/api/admin/sources/${sourceId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Enregistrement impossible.",
  );
}

async function deleteSource(sourceId: string) {
  return fetchJsonVoid(
    `/api/admin/sources/${sourceId}`,
    { method: "DELETE" },
    "Suppression impossible.",
  );
}

export function useCreateSource() {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.sources(), "create"],
    mutationFn: createSource,
    onSuccess: () => {
      router.refresh();
    },
  });
}

export function useUpdateSource(sourceId: string) {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.source(sourceId), "update"],
    mutationFn: (input: SourcePatchInput) => updateSource(sourceId, input),
    onSuccess: () => {
      router.refresh();
    },
  });
}

export function useDeleteSource() {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.sources(), "delete"],
    mutationFn: deleteSource,
    onSuccess: () => {
      router.refresh();
    },
  });
}
