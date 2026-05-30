import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { fetchJson } from "@/lib/api/fetch-json";
import { adminQueryKeys } from "@/lib/admin/query-keys";
import type { OrganizationCategory } from "@/db/schema";

type UpdateOrganizationInput = {
  organizationId: string;
  category?: OrganizationCategory | null;
  locationRaw?: string | null;
};

async function updateOrganization({
  organizationId,
  ...input
}: UpdateOrganizationInput) {
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

export function useUpdateOrganization(organizationId: string) {
  const router = useRouter();

  return useMutation({
    mutationKey: [...adminQueryKeys.organizations(), organizationId],
    mutationFn: (input: Omit<UpdateOrganizationInput, "organizationId">) =>
      updateOrganization({ organizationId, ...input }),
    onSuccess: () => {
      router.refresh();
    },
  });
}
