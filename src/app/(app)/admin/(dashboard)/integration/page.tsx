import type { Metadata } from "next";
import { Suspense } from "react";
import { asc, eq } from "drizzle-orm";

import { IntegrationsListAdmin } from "@/components/admin/integrations-list-admin";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { requireAdminDataScope } from "@/lib/admin/access";
import { listAdminIntegrations } from "@/lib/integrations/admin-list";
import { adminMetadata } from "@/lib/metadata";

export const metadata: Metadata = adminMetadata({
  title: "Intégration",
  description:
    "Liste et gestion des intégrations agenda embarquées pour les organisateurs.",
});

function AdminIntegrationPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

async function AdminIntegrationPageContent() {
  const dataScope = await requireAdminDataScope();
  const integrations = await listAdminIntegrations(dataScope);

  if (dataScope.mode === "all") {
    const organizationRows = await db.query.organizations.findMany({
      orderBy: asc(organizations.name),
      columns: {
        id: true,
        name: true,
        integrationsQuota: true,
      },
    });

    const countByOrganizationId = new Map<string, number>();
    for (const integration of integrations) {
      countByOrganizationId.set(
        integration.organizationId,
        (countByOrganizationId.get(integration.organizationId) ?? 0) + 1,
      );
    }

    const organizationOptions = organizationRows.map((organization) => ({
      id: organization.id,
      name: organization.name,
      integrationsQuota: organization.integrationsQuota,
      integrationCount: countByOrganizationId.get(organization.id) ?? 0,
    }));

    const entitled = organizationOptions.some(
      (organization) => organization.integrationsQuota > 0,
    );

    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold">Intégration</h1>
          <p className="text-muted-foreground max-w-2xl">
            Toutes les intégrations agenda embarquées, tous organisateurs
            confondus.
          </p>
        </div>

        <IntegrationsListAdmin
          integrations={integrations}
          organizations={organizationOptions}
          platformMode
          entitled={entitled}
        />
      </div>
    );
  }

  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, dataScope.organizationId),
  });

  if (!organization) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold">Intégration</h1>
        <p className="text-muted-foreground max-w-2xl">
          Cette organisation Clerk n&apos;est pas encore reliée à un organisateur
          Swingin Toulouse.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold">Intégration</h1>
        <p className="text-muted-foreground max-w-2xl">
          Intégrations agenda embarquées pour {organization.name}.
        </p>
      </div>

      <IntegrationsListAdmin
        integrations={integrations}
        organizations={[
          {
            id: organization.id,
            name: organization.name,
            integrationsQuota: organization.integrationsQuota,
            integrationCount: integrations.length,
          },
        ]}
        platformMode={false}
        entitled={organization.integrationsQuota > 0}
        defaultOrganizationId={organization.id}
      />
    </div>
  );
}

export default function AdminIntegrationPage() {
  return (
    <Suspense fallback={<AdminIntegrationPageSkeleton />}>
      <AdminIntegrationPageContent />
    </Suspense>
  );
}
