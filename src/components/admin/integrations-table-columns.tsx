import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { Settings2, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CustomDomainStatus } from "@/db/schema";
import type { AdminIntegrationRow } from "@/lib/integrations/admin-list";

const domainStatusLabels: Record<CustomDomainStatus, string> = {
  none: "—",
  pending: "En attente",
  verified: "Vérifié",
  failed: "Échec",
};

type IntegrationsTableColumnsOptions = {
  showOrganization: boolean;
  onDelete: (integration: AdminIntegrationRow) => void;
};

export function createIntegrationsTableColumns({
  showOrganization,
  onDelete,
}: IntegrationsTableColumnsOptions): ColumnDef<AdminIntegrationRow>[] {
  const columns: ColumnDef<AdminIntegrationRow>[] = [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
  ];

  if (showOrganization) {
    columns.push({
      accessorKey: "organizationName",
      header: "Organisateur",
      cell: ({ row }) => row.original.organizationName,
    });
  }

  columns.push(
    {
      accessorKey: "customDomain",
      header: "Domaine",
      cell: ({ row }) =>
        row.original.customDomain ? (
          <div className="flex flex-col gap-1">
            <span className="text-sm">{row.original.customDomain}</span>
            <Badge variant="secondary" className="w-fit text-xs">
              {domainStatusLabels[row.original.customDomainStatus]}
            </Badge>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      accessorKey: "isActive",
      header: "Statut",
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge variant="outline">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const integration = row.original;

        return (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={
                <Link href={`/admin/integration/${integration.id}`} />
              }
            >
              <Settings2 data-icon="inline-start" />
              Configurer
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(integration)}
            >
              <Trash2 data-icon="inline-start" />
              Supprimer
            </Button>
          </div>
        );
      },
    },
  );

  return columns;
}
