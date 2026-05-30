"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { OrganizationSelect } from "@/components/admin/organization-select";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useCreateSource,
  useUpdateSource,
} from "@/lib/admin/use-sources";
import { formatVenueAsDefaultLocation } from "@/lib/sources/defaults";
import { parseSourceCategoriesInput } from "@/lib/sources/schemas";
import type { AdminSourceRow } from "@/lib/sources/admin";
import { generateSourceSlug } from "@/lib/slug";
import type { OrganizationSelectOption } from "@/components/admin/organization-select";
import type { VenueSelectOption } from "@/lib/venues/select-options";

type SourceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: AdminSourceRow | null;
  organizations: OrganizationSelectOption[];
  venues: VenueSelectOption[];
};

function emptyFormState() {
  return {
    name: "",
    slug: "",
    url: "",
    organizationId: "",
    defaultVenueId: "",
    defaultCategories: "",
    isActive: true,
  };
}

function findVenueIdForDefaultLocation(
  venues: VenueSelectOption[],
  defaultLocationRaw: string | null,
) {
  if (!defaultLocationRaw?.trim()) {
    return "";
  }

  const trimmed = defaultLocationRaw.trim();
  const match = venues.find(
    (venue) => formatVenueAsDefaultLocation(venue) === trimmed,
  );

  return match?.id ?? "";
}

function formStateFromSource(
  source: AdminSourceRow,
  venues: VenueSelectOption[],
) {
  return {
    name: source.name,
    slug: source.slug,
    url: source.url,
    organizationId: source.organizationId ?? "",
    defaultVenueId: findVenueIdForDefaultLocation(
      venues,
      source.defaultLocationRaw,
    ),
    defaultCategories: (source.defaultCategories ?? []).join(", "),
    isActive: source.isActive,
  };
}

export function SourceFormDialog({
  open,
  onOpenChange,
  source,
  organizations,
  venues,
}: SourceFormDialogProps) {
  const isEdit = source !== null;
  const createSource = useCreateSource();
  const updateSource = useUpdateSource(source?.id ?? "");
  const slugManuallyEdited = useRef(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [url, setUrl] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [defaultVenueId, setDefaultVenueId] = useState("");
  const [defaultCategories, setDefaultCategories] = useState("");
  const [isActive, setIsActive] = useState(true);

  const pending = createSource.isPending || updateSource.isPending;
  const canSubmit = Boolean(name.trim() && slug.trim() && url.trim());

  const defaultLocationPreview = useMemo(() => {
    if (!defaultVenueId) {
      return null;
    }

    const venue = venues.find((entry) => entry.id === defaultVenueId);
    return venue ? formatVenueAsDefaultLocation(venue) : null;
  }, [defaultVenueId, venues]);

  useEffect(() => {
    if (!open) {
      return;
    }

    slugManuallyEdited.current = false;
    const nextState = source
      ? formStateFromSource(source, venues)
      : emptyFormState();
    setName(nextState.name);
    setSlug(nextState.slug);
    setUrl(nextState.url);
    setOrganizationId(nextState.organizationId);
    setDefaultVenueId(nextState.defaultVenueId);
    setDefaultCategories(nextState.defaultCategories);
    setIsActive(nextState.isActive);
  }, [open, source, venues]);

  function handleNameChange(nextName: string) {
    setName(nextName);

    if (!slugManuallyEdited.current) {
      setSlug(nextName.trim() ? generateSourceSlug(nextName) : "");
    }
  }

  function handleDefaultVenueChange(venueId: string) {
    setDefaultVenueId(venueId);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      url: url.trim(),
      organizationId: organizationId || null,
      defaultLocationRaw: defaultLocationPreview,
      defaultCategories: parseSourceCategoriesInput(defaultCategories),
      isActive,
    };

    try {
      if (isEdit) {
        await updateSource.mutateAsync(payload);
        toast.success("Source enregistrée.");
      } else {
        await createSource.mutateAsync(payload);
        toast.success("Source créée.");
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
            {isEdit ? "Modifier la source" : "Nouvelle source iCal"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mettez à jour le flux et ses valeurs par défaut pour la synchronisation."
              : "Ajoutez un calendrier iCal à synchroniser."}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="source-name">Nom</Label>
            <Input
              id="source-name"
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              required
              disabled={pending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="source-slug">Slug</Label>
            <Input
              id="source-slug"
              value={slug}
              onChange={(event) => {
                slugManuallyEdited.current = true;
                setSlug(event.target.value);
              }}
              required
              disabled={pending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="source-url">URL iCal</Label>
            <Input
              id="source-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              required
              disabled={pending}
              placeholder="https://…"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Organisateur</Label>
            <OrganizationSelect
              organizations={organizations}
              value={organizationId}
              onChange={setOrganizationId}
              disabled={pending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Lieu par défaut</Label>
            <VenueSelect
              venues={venues}
              value={defaultVenueId}
              onChange={handleDefaultVenueChange}
              disabled={pending}
              placeholder="Aucun lieu par défaut…"
              emptyLabel="— Aucun —"
            />
            <p className="text-muted-foreground text-xs">
              Utilisé quand le flux iCal n&apos;indique pas de lieu. Relancez une
              sync après modification.
            </p>
            {isEdit &&
            !defaultVenueId &&
            source.defaultLocationRaw?.trim() ? (
              <p className="text-muted-foreground text-xs">
                Lieu actuel (hors liste) : {source.defaultLocationRaw}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="source-categories">Catégories par défaut</Label>
            <Input
              id="source-categories"
              value={defaultCategories}
              onChange={(event) => setDefaultCategories(event.target.value)}
              disabled={pending}
              placeholder="Ex. Lindy Hop, Soirée"
            />
            <p className="text-muted-foreground text-xs">
              Séparez les catégories par des virgules.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="source-active">Active</Label>
              <p className="text-muted-foreground text-xs">
                Les sources inactives ne sont pas synchronisées.
              </p>
            </div>
            <Switch
              id="source-active"
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
