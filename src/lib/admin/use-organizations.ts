import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { fetchJson, fetchJsonVoid } from "@/lib/api/fetch-json";
import { adminQueryKeys } from "@/lib/admin/query-keys";
import type { OrganizationCategory } from "@/db/schema";
import type {
  OrganizationPatchInput,
  OrganizationWriteInput,
} from "@/lib/organizations/schemas";

export type OrganizationMutationInput = {
  name?: string;
  slug?: string;
  description?: string | null;
  website?: string | null;
  category?: OrganizationCategory | null;
  venueId?: string;
  isActive?: boolean;
};

async function createOrganization(input: OrganizationWriteInput) {
  return fetchJson(
    "/api/admin/organizations",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Création impossible.",
  );
}

async function updateOrganization(
  organizationId: string,
  input: OrganizationPatchInput,
) {
  return fetchJson(
    `/api/admin/organizations/${organizationId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    "Enregistrement impossible.",
  );
}

async function deleteOrganization(organizationId: string) {
  return fetchJsonVoid(
    `/api/admin/organizations/${organizationId}`,
    { method: "DELETE" },
    "Suppression impossible.",
  );
}

export function useCreateOrganization() {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.organizations(), "create"],
    mutationFn: createOrganization,
    onSuccess: () => {
      router.refresh();
    },
  });
}

export function useUpdateOrganization(organizationId: string) {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.organization(organizationId), "update"],
    mutationFn: (input: OrganizationPatchInput) =>
      updateOrganization(organizationId, input),
    onSuccess: () => {
      router.refresh();
    },
  });
}

export function useDeleteOrganization() {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.organizations(), "delete"],
    mutationFn: deleteOrganization,
    onSuccess: () => {
      router.refresh();
    },
  });
}

/** @deprecated Use useUpdateOrganization with full OrganizationPatchInput */
export type UpdateOrganizationInput = OrganizationMutationInput;
