import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { IntegrationEditor } from "@/components/admin/integration-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdminDataScope } from "@/lib/admin/access";
import { getIntegrationForAdminScope } from "@/lib/integrations/access";
import { serializeIntegration } from "@/lib/integrations/serialize";
import { adminMetadata } from "@/lib/metadata";

type AdminIntegrationEditorPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: AdminIntegrationEditorPageProps): Promise<Metadata> {
  const { id } = await params;
  const dataScope = await requireAdminDataScope();
  const result = await getIntegrationForAdminScope(dataScope, id);

  if ("error" in result) {
    return adminMetadata({
      title: "Intégration",
      description: "Configuration d'une intégration agenda embarquée.",
    });
  }

  return adminMetadata({
    title: result.integration.name,
    description: `Configuration de l'intégration ${result.integration.name}.`,
  });
}

function IntegrationEditorPageSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <Skeleton className="h-14 w-full shrink-0 rounded-none" />
      <div className="flex min-h-0 flex-1">
        <Skeleton className="h-full w-56 shrink-0 rounded-none" />
        <Skeleton className="h-full flex-1 rounded-none" />
      </div>
    </div>
  );
}

async function AdminIntegrationEditorPageContent({
  params,
}: AdminIntegrationEditorPageProps) {
  const { id } = await params;
  const dataScope = await requireAdminDataScope();
  const result = await getIntegrationForAdminScope(dataScope, id);

  if ("error" in result) {
    notFound();
  }

  const integration = serializeIntegration(result.integration);

  return (
    <IntegrationEditor
      integration={integration}
      organizationName={result.integration.organization.name}
    />
  );
}

export default function AdminIntegrationEditorPage(
  props: AdminIntegrationEditorPageProps,
) {
  return (
    <Suspense fallback={<IntegrationEditorPageSkeleton />}>
      <AdminIntegrationEditorPageContent {...props} />
    </Suspense>
  );
}
