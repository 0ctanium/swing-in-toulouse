"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { VenueSelect } from "@/components/admin/venue-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EntitySelect } from "@/components/ui/entity-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateOrganization,
  useUpdateOrganization,
} from "@/lib/admin/use-organizations";
import type { OrganizationCategory } from "@/db/schema";
import type { AdminOrganizationRow } from "@/lib/organizations/admin";
import { organizationCategoryOptions } from "@/lib/organizations/categories";
import { generateOrganizationSlug } from "@/lib/slug";
import type { VenueSelectOption } from "@/lib/venues/select-options";

type OrganizationFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: AdminOrganizationRow | null;
  venues: VenueSelectOption[];
};

function emptyFormState() {
  return {
    name: "",
    slug: "",
    description: "",
    website: "",
    category: "",
    venueId: "",
    isActive: true,
  };
}

function formStateFromOrganization(organization: AdminOrganizationRow) {
  return {
    name: organization.name,
    slug: organization.slug,
    description: organization.description ?? "",
    website: organization.website ?? "",
    category: organization.category ?? "",
    venueId: organization.venueId ?? "",
    isActive: organization.isActive,
  };
}

export function OrganizationFormDialog({
  open,
  onOpenChange,
  organization,
  venues,
}: OrganizationFormDialogProps) {
  const isEdit = organization !== null;
  const createOrganization = useCreateOrganization();
  const updateOrganization = useUpdateOrganization(organization?.id ?? "");
  const slugManuallyEdited = useRef(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [category, setCategory] = useState("");
  const [venueId, setVenueId] = useState("");
  const [isActive, setIsActive] = useState(true);

  const pending = createOrganization.isPending || updateOrganization.isPending;
  const canSubmit = Boolean(name.trim() && slug.trim());

  useEffect(() => {
    if (!open) {
      return;
    }

    slugManuallyEdited.current = false;
    const nextState = organization
      ? formStateFromOrganization(organization)
      : emptyFormState();
    setName(nextState.name);
    setSlug(nextState.slug);
    setDescription(nextState.description);
    setWebsite(nextState.website);
    setCategory(nextState.category);
    setVenueId(nextState.venueId);
    setIsActive(nextState.isActive);
  }, [open, organization]);

  function handleNameChange(nextName: string) {
    setName(nextName);

    if (!slugManuallyEdited.current) {
      setSlug(nextName.trim() ? generateOrganizationSlug(nextName) : "");
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      website: website.trim() || null,
      category: category ? (category as OrganizationCategory) : null,
      venueId: venueId || null,
      isActive,
    };

    try {
      if (isEdit) {
        await updateOrganization.mutateAsync(payload);
        toast.success("Organisateur enregistré.");
      } else {
        await createOrganization.mutateAsync(payload);
        toast.success("Organisateur créé.");
      }

      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Enregistrement impossible.",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier l'organisateur" : "Nouvel organisateur"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mettez à jour les informations publiques et le lieu associé."
              : "Créez un organisateur. Le lieu peut être renseigné plus tard."}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="organization-name">Nom</Label>
            <Input
              id="organization-name"
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              required
              disabled={pending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="organization-slug">Slug</Label>
            <Input
              id="organization-slug"
              value={slug}
              onChange={(event) => {
                slugManuallyEdited.current = true;
                setSlug(event.target.value);
              }}
              required
              disabled={pending}
              placeholder="ex. trac-lecole"
            />
            <p className="text-muted-foreground text-xs">
              URL publique : /organisateur/{slug || "…"}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="organization-description">Description</Label>
            <Textarea
              id="organization-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={pending}
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="organization-website">Site web</Label>
            <Input
              id="organization-website"
              type="url"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              disabled={pending}
              placeholder="https://…"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Catégorie</Label>
            <EntitySelect
              value={category}
              onChange={setCategory}
              allowEmpty
              emptyLabel="— Non catégorisé —"
              placeholder="Choisir une catégorie…"
              disabled={pending}
              options={organizationCategoryOptions().map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Lieu</Label>
            <VenueSelect
              venues={venues}
              value={venueId}
              onChange={setVenueId}
              allowEmpty
              placeholder="Choisir un lieu…"
              disabled={pending}
            />
            <p className="text-muted-foreground text-xs">
              Seuls les lieux principaux (non alias) peuvent être associés.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="organization-active">Actif</Label>
              <p className="text-muted-foreground text-xs">
                Les organisateurs inactifs restent en base mais peuvent être
                masqués côté public.
              </p>
            </div>
            <Switch
              id="organization-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={pending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={pending || !canSubmit}>
              {pending
                ? "Enregistrement…"
                : isEdit
                  ? "Enregistrer"
                  : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
