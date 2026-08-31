"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EntitySelect } from "@/components/ui/entity-select";
import { fetchJson } from "@/lib/api/fetch-json";
import type { IntegrationListItem } from "@/lib/integrations/serialize";

export type IntegrationCreateOrganizationOption = {
  id: string;
  name: string;
  integrationsQuota: number;
  integrationCount: number;
};

type IntegrationCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizations: IntegrationCreateOrganizationOption[];
  defaultOrganizationId?: string;
  platformMode?: boolean;
};

export function IntegrationCreateDialog({
  open,
  onOpenChange,
  organizations,
  defaultOrganizationId,
  platformMode = false,
}: IntegrationCreateDialogProps) {
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState(
    defaultOrganizationId ?? organizations[0]?.id ?? "",
  );
  const [name, setName] = useState("Agenda");
  const [pending, setPending] = useState(false);

  const selectedOrganization = organizations.find(
    (organization) => organization.id === organizationId,
  );
  const canCreate =
    selectedOrganization &&
    selectedOrganization.integrationsQuota > 0 &&
    selectedOrganization.integrationCount <
      selectedOrganization.integrationsQuota;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedOrganization || !canCreate) {
      return;
    }

    setPending(true);

    try {
      const result = await fetchJson<{ integration: IntegrationListItem }>(
        "/api/admin/integrations",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            organizationId: selectedOrganization.id,
          }),
        },
        "Création impossible.",
      );

      toast.success("Intégration créée.");
      onOpenChange(false);
      router.push(`/admin/integration/${result.integration.id}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Création impossible.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle intégration</DialogTitle>
          <DialogDescription>
            Créez une intégration agenda embarquée. Vous pourrez configurer le
            code, le domaine et les filtres sur la page suivante.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {platformMode ? (
            <div className="flex flex-col gap-2">
              <Label>Organisateur</Label>
              <EntitySelect
                value={organizationId}
                onChange={setOrganizationId}
                placeholder="Choisir un organisateur…"
                disabled={pending}
                options={organizations.map((organization) => ({
                  value: organization.id,
                  label: `${organization.name} (${organization.integrationCount}/${organization.integrationsQuota})`,
                  disabled: organization.integrationsQuota <= 0,
                }))}
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="integration-create-name">Nom</Label>
            <Input
              id="integration-create-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Agenda"
              disabled={pending}
              required
            />
          </div>

          {!canCreate && selectedOrganization ? (
            <p className="text-muted-foreground text-sm">
              Quota atteint pour cet organisateur. Augmentez le quota dans la
              fiche organisateur.
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={pending || !canCreate || !name.trim()}
            >
              {pending ? "Création…" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
