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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  formatSourceSyncMessage,
  useCreateFileSource,
  useCreateSource,
  useReplaceSourceFile,
  useUpdateSource,
} from "@/lib/admin/use-sources";
import { formatVenueAsDefaultLocation } from "@/lib/sources/defaults";
import { parseSourceCategoriesInput } from "@/lib/sources/schemas";
import type { AdminSourceRow } from "@/lib/sources/admin";
import type { SourceType } from "@/db/schema";
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
    type: "ical" as SourceType,
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
    type: source.type,
    name: source.name,
    slug: source.slug,
    url: source.url ?? "",
    organizationId: source.organizationId ?? "",
    defaultVenueId: findVenueIdForDefaultLocation(
      venues,
      source.defaultLocationRaw,
    ),
    defaultCategories: (source.defaultCategories ?? []).join(", "),
    isActive: source.isActive,
  };
}

function formatFileSize(bytes: number | null) {
  if (bytes === null) {
    return null;
  }

  if (bytes < 1024) {
    return `${bytes} o`;
  }

  return `${(bytes / 1024).toFixed(1)} Ko`;
}

function formatUploadedAt(value: Date | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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
  const createFileSource = useCreateFileSource();
  const updateSource = useUpdateSource(source?.id ?? "");
  const replaceSourceFile = useReplaceSourceFile(source?.id ?? "");
  const slugManuallyEdited = useRef(false);

  const [type, setType] = useState<SourceType>("ical");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [url, setUrl] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [defaultVenueId, setDefaultVenueId] = useState("");
  const [defaultCategories, setDefaultCategories] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const pending =
    createSource.isPending ||
    createFileSource.isPending ||
    updateSource.isPending ||
    replaceSourceFile.isPending;

  const isFileSource = type === "ical-file";
  const canSubmit =
    Boolean(name.trim() && slug.trim()) &&
    (isEdit
      ? isFileSource
        ? true
        : Boolean(url.trim())
      : isFileSource
        ? Boolean(selectedFile)
        : Boolean(url.trim()));

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
    setSelectedFile(null);

    const nextState = source
      ? formStateFromSource(source, venues)
      : emptyFormState();
    setType(nextState.type);
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

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const metadata = {
      name: name.trim(),
      slug: slug.trim(),
      organizationId: organizationId || null,
      defaultLocationRaw: defaultLocationPreview,
      defaultCategories: parseSourceCategoriesInput(defaultCategories),
      isActive,
    };

    try {
      if (isEdit) {
        await updateSource.mutateAsync({
          ...metadata,
          ...(isFileSource ? {} : { url: url.trim() }),
        });

        if (isFileSource && selectedFile) {
          const formData = new FormData();
          formData.append("file", selectedFile);
          const result = await replaceSourceFile.mutateAsync(formData);
          const syncMessage = formatSourceSyncMessage(result.sync);

          if (syncMessage) {
            if (result.sync && "error" in result.sync) {
              toast.error(syncMessage);
            } else {
              toast.success(syncMessage);
            }
          } else {
            toast.success("Fichier iCal remplacé.");
          }
        } else {
          toast.success("Source enregistrée.");
        }
      } else if (isFileSource) {
        if (!selectedFile) {
          toast.error("Sélectionnez un fichier iCal.");
          return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("name", metadata.name);
        formData.append("slug", metadata.slug);
        if (metadata.organizationId) {
          formData.append("organizationId", metadata.organizationId);
        }
        if (metadata.defaultLocationRaw) {
          formData.append("defaultLocationRaw", metadata.defaultLocationRaw);
        }
        if (metadata.defaultCategories.length > 0) {
          formData.append(
            "defaultCategories",
            metadata.defaultCategories.join(", "),
          );
        }
        formData.append("isActive", String(metadata.isActive));

        const result = await createFileSource.mutateAsync(formData);
        const syncMessage = formatSourceSyncMessage(result.sync);

        if (syncMessage) {
          if (result.sync && "error" in result.sync) {
            toast.error(syncMessage);
          } else {
            toast.success(syncMessage);
          }
        } else {
          toast.success("Source créée.");
        }
      } else {
        await createSource.mutateAsync({
          ...metadata,
          type: "ical",
          url: url.trim(),
        });
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
            {isEdit ? "Modifier la source" : "Nouvelle source"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mettez à jour la source et ses valeurs par défaut pour la synchronisation."
              : "Ajoutez un calendrier iCal par URL ou par fichier."}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label>Type de source</Label>
            {isEdit ? (
              <p className="text-sm">
                {isFileSource ? "Fichier iCal" : "Flux URL (iCal)"}
              </p>
            ) : (
              <Select
                value={type}
                onValueChange={(value) => setType(value as SourceType)}
                disabled={pending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ical">Flux URL (iCal)</SelectItem>
                  <SelectItem value="ical-file">Fichier iCal</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

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

          {isFileSource ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="source-file">Fichier iCal</Label>
              {isEdit && source.icalFileName ? (
                <div className="rounded-lg border px-3 py-2 text-sm">
                  <p className="font-medium">{source.icalFileName}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatFileSize(source.icalFileSize)}
                    {source.icalUploadedAt
                      ? ` · importé le ${formatUploadedAt(source.icalUploadedAt)}`
                      : null}
                  </p>
                </div>
              ) : null}
              <Input
                key={isEdit ? `file-edit-${source.id}` : "file-create"}
                id="source-file"
                type="file"
                accept=".ics,text/calendar"
                onChange={handleFileChange}
                required={!isEdit}
                disabled={pending}
              />
              <p className="text-muted-foreground text-xs">
                {isEdit
                  ? "Choisissez un nouveau fichier pour remplacer l’actuel et relancer une sync."
                  : "Fichier .ics uniquement, 10 Mo maximum."}
              </p>
            </div>
          ) : (
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
          )}

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
