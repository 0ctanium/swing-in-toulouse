import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { fetchJson, fetchJsonVoid } from "@/lib/api/fetch-json";
import { adminQueryKeys } from "@/lib/admin/query-keys";
import type {
  SourcePatchInput,
  SourceSyncResult,
  SourceWriteInput,
} from "@/lib/sources/schemas";

type SourceMutationResponse = {
  source: {
    id: string;
  };
  sync?: SourceSyncResult;
};

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

async function createFileSource(formData: FormData) {
  return fetchJson<SourceMutationResponse>(
    "/api/admin/sources",
    {
      method: "POST",
      body: formData,
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

async function replaceSourceFile(sourceId: string, formData: FormData) {
  return fetchJson<SourceMutationResponse>(
    `/api/admin/sources/${sourceId}/file`,
    {
      method: "PUT",
      body: formData,
    },
    "Mise à jour du fichier impossible.",
  );
}

async function syncSourceNow(sourceId: string) {
  return fetchJson<SourceMutationResponse>(
    `/api/admin/sources/${sourceId}/sync`,
    {
      method: "POST",
    },
    "Synchronisation impossible.",
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

export function useCreateFileSource() {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.sources(), "create-file"],
    mutationFn: createFileSource,
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

export function useReplaceSourceFile(sourceId: string) {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.source(sourceId), "replace-file"],
    mutationFn: (formData: FormData) => replaceSourceFile(sourceId, formData),
    onSuccess: () => {
      router.refresh();
    },
  });
}

export function useSyncSource(sourceId: string) {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.source(sourceId), "sync"],
    mutationFn: () => syncSourceNow(sourceId),
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

export function formatSourceSyncMessage(sync: SourceSyncResult | undefined) {
  if (!sync) {
    return null;
  }

  if ("error" in sync) {
    return `Synchronisation échouée : ${sync.error}`;
  }

  return `Sync : ${sync.created} créés, ${sync.updated} mis à jour, ${sync.unchanged} inchangés, ${sync.cancelled} annulés.`;
}
