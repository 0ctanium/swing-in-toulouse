"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  IntegrationCreateDialog,
  type IntegrationCreateOrganizationOption,
} from "@/components/admin/integration-create-dialog";
import { createIntegrationsTableColumns } from "@/components/admin/integrations-table-columns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchJsonVoid } from "@/lib/api/fetch-json";
import type { AdminIntegrationRow } from "@/lib/integrations/admin-list";

type IntegrationsListAdminProps = {
  integrations: AdminIntegrationRow[];
  organizations: IntegrationCreateOrganizationOption[];
  platformMode: boolean;
  entitled: boolean;
  defaultOrganizationId?: string;
};

export function IntegrationsListAdmin({
  integrations,
  organizations,
  platformMode,
  entitled,
  defaultOrganizationId,
}: IntegrationsListAdminProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  const columns = useMemo(
    () =>
      createIntegrationsTableColumns({
        showOrganization: platformMode,
        onDelete: async (integration) => {
          if (
            !window.confirm(
              `Supprimer l'intégration « ${integration.name} » ? Cette action est irréversible.`,
            )
          ) {
            return;
          }

          try {
            await fetchJsonVoid(
              `/api/admin/integrations/${integration.id}`,
              { method: "DELETE" },
              "Suppression impossible.",
            );
            toast.success("Intégration supprimée.");
            router.refresh();
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Suppression impossible.",
            );
          }
        },
      }),
    [platformMode, router],
  );

  const table = useReactTable({
    data: integrations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  const canCreateAny = organizations.some(
    (organization) =>
      organization.integrationsQuota > 0 &&
      organization.integrationCount < organization.integrationsQuota,
  );

  if (!entitled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Option payante</CardTitle>
          <CardDescription>
            L&apos;agenda embarqué et les domaines personnalisés sont disponibles
            après activation manuelle par l&apos;équipe Swingin Toulouse.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            nativeButton={false}
            render={<a href="mailto:contact@swing-toulouse.fr" />}
          >
            Nous contacter
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {integrations.length} intégration{integrations.length > 1 ? "s" : ""}
        </p>
        <Button
          type="button"
          onClick={() => setCreateOpen(true)}
          disabled={!canCreateAny}
        >
          <Plus data-icon="inline-start" />
          Nouvelle intégration
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-24 text-center"
                >
                  Aucune intégration. Créez-en une pour commencer.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <IntegrationCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        organizations={organizations}
        defaultOrganizationId={defaultOrganizationId}
        platformMode={platformMode}
      />
    </>
  );
}
