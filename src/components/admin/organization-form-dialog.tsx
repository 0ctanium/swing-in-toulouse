"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateOrganization,
  useUpdateOrganization,
} from "@/lib/admin/use-organizations";
import type { OrganizationCategory } from "@/db/schema";
import type { AdminOrganizationRow } from "@/lib/organizations/admin";
import { organizationCategoryOptions } from "@/lib/organizations/categories";
import {
  organizationDanceOptions,
  type OrganizationDance,
} from "@/lib/organizations/dances";
import {
  organizationSocialPlatformOptions,
  type OrganizationSocialLinks,
  type OrganizationSocialPlatform,
} from "@/lib/organizations/social-links";
import { generateOrganizationSlug } from "@/lib/slug";
import type { VenueSelectOption } from "@/lib/venues/select-options";
import { cn } from "@/lib/utils";

type OrganizationFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: AdminOrganizationRow | null;
  venues: VenueSelectOption[];
};

function emptySocialLinks(): Record<OrganizationSocialPlatform, string> {
  return {
    facebook: "",
    instagram: "",
    youtube: "",
    tiktok: "",
  };
}

function socialLinksFromOrganization(
  socialLinks: OrganizationSocialLinks | null | undefined,
) {
  const next = emptySocialLinks();

  if (!socialLinks) {
    return next;
  }

  for (const platform of organizationSocialPlatformOptions()) {
    next[platform.value] = socialLinks[platform.value] ?? "";
  }

  return next;
}

function emptyFormState() {
  return {
    name: "",
    slug: "",
    description: "",
    website: "",
    category: "",
    dances: [] as OrganizationDance[],
    socialLinks: emptySocialLinks(),
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
    dances: organization.dances ?? [],
    socialLinks: socialLinksFromOrganization(organization.socialLinks),
    venueId: organization.venueId ?? "",
    isActive: organization.isActive,
  };
}

function formatDanceSelectionSummary(dances: OrganizationDance[]) {
  if (dances.length === 0) {
    return "Choisir les danses…";
  }

  if (dances.length <= 2) {
    return dances.join(", ");
  }

  return `${dances[0]}, ${dances[1]} +${dances.length - 2}`;
}

function DanceMultiSelect({
  values,
  onChange,
  disabled,
}: {
  values: OrganizationDance[];
  onChange: (values: OrganizationDance[]) => void;
  disabled?: boolean;
}) {
  const options = organizationDanceOptions();

  function toggleValue(value: OrganizationDance) {
    if (values.includes(value)) {
      onChange(values.filter((current) => current !== value));
      return;
    }

    onChange([...values, value]);
  }

  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50",
          values.length === 0 && "text-muted-foreground",
        )}
      >
        <span className="min-w-0 truncate text-left">
          {formatDanceSelectionSummary(values)}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        className="w-(--anchor-width) min-w-56 p-1"
      >
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-label="Danses"
          className="flex max-h-60 flex-col gap-0.5 overflow-y-auto"
        >
          {options.map((option) => {
            const selected = values.includes(option.value);

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                  selected && "bg-accent/60",
                )}
                onClick={() => toggleValue(option.value)}
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input",
                  )}
                >
                  {selected ? <Check className="size-3" /> : null}
                </span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
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
  const [dances, setDances] = useState<OrganizationDance[]>([]);
  const [socialLinks, setSocialLinks] = useState(emptySocialLinks());
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
    setDances(nextState.dances);
    setSocialLinks(nextState.socialLinks);
    setVenueId(nextState.venueId);
    setIsActive(nextState.isActive);
  }, [open, organization]);

  function handleNameChange(nextName: string) {
    setName(nextName);

    if (!slugManuallyEdited.current) {
      setSlug(nextName.trim() ? generateOrganizationSlug(nextName) : "");
    }
  }

  function handleSocialLinkChange(
    platform: OrganizationSocialPlatform,
    value: string,
  ) {
    setSocialLinks((current) => ({
      ...current,
      [platform]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      website: website.trim() || null,
      category: category ? (category as OrganizationCategory) : null,
      dances: dances.length > 0 ? dances : null,
      socialLinks: {
        facebook: socialLinks.facebook.trim() || null,
        instagram: socialLinks.instagram.trim() || null,
        youtube: socialLinks.youtube.trim() || null,
        tiktok: socialLinks.tiktok.trim() || null,
      },
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
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

          <div className="flex flex-col gap-3 rounded-lg border px-3 py-3">
            <div className="flex flex-col gap-0.5">
              <Label>Réseaux sociaux</Label>
              <p className="text-muted-foreground text-xs">
                Liens optionnels vers les profils publics.
              </p>
            </div>
            {organizationSocialPlatformOptions().map((platform) => (
              <div key={platform.value} className="flex flex-col gap-2">
                <Label htmlFor={`organization-social-${platform.value}`}>
                  {platform.label}
                </Label>
                <Input
                  id={`organization-social-${platform.value}`}
                  type="url"
                  value={socialLinks[platform.value]}
                  onChange={(event) =>
                    handleSocialLinkChange(platform.value, event.target.value)
                  }
                  disabled={pending}
                  placeholder="https://…"
                />
              </div>
            ))}
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
            <Label>Danses</Label>
            <DanceMultiSelect
              values={dances}
              onChange={setDances}
              disabled={pending}
            />
            <p className="text-muted-foreground text-xs">
              Styles enseignés ou proposés par l&apos;organisateur.
            </p>
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
