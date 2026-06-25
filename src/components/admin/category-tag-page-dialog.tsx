"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCategoryTagRow } from "@/lib/event-category-tags/admin";
import {
  isHeroTitleCustomized,
} from "@/lib/event-category-tags/hero-title";
import {
  categoryTagPublicPath,
  isPublishableTagType,
} from "@/lib/event-category-tags/publishable";
import { defaultHeroTitleForTag } from "@/lib/event-collections/metadata";
import { useUpdateCategoryTag } from "@/lib/admin/use-category-tags";
import { generateCategoryTagSlug } from "@/lib/slug";
import { DanceHeroTitle } from "@/components/dances/dance-hero-title";

type CategoryTagPageDialogProps = {
  row: AdminCategoryTagRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function heroFieldsFromRow(row: AdminCategoryTagRow) {
  const stored = {
    heroTitleBefore: row.heroTitleBefore,
    heroTitleEmphasis: row.heroTitleEmphasis,
    heroTitleAfter: row.heroTitleAfter,
  };

  if (isHeroTitleCustomized(stored)) {
    return {
      heroTitleBefore: row.heroTitleBefore ?? "",
      heroTitleEmphasis: row.heroTitleEmphasis ?? "",
      heroTitleAfter: row.heroTitleAfter ?? "",
    };
  }

  if (!isPublishableTagType(row.tagType)) {
    return {
      heroTitleBefore: "",
      heroTitleEmphasis: "",
      heroTitleAfter: "",
    };
  }

  const defaults = defaultHeroTitleForTag(row.tagType, row.name);

  return {
    heroTitleBefore: defaults.heroTitleBefore ?? "",
    heroTitleEmphasis: defaults.heroTitleEmphasis ?? row.name,
    heroTitleAfter: defaults.heroTitleAfter ?? "",
  };
}

function formStateFromRow(row: AdminCategoryTagRow) {
  const heroFields = heroFieldsFromRow(row);

  return {
    slug: row.slug ?? generateCategoryTagSlug(row.name),
    ...heroFields,
    subtitle: row.subtitle ?? "",
    description: row.description ?? "",
    seoTitle: row.seoTitle ?? "",
    seoDescription: row.seoDescription ?? "",
    isPublished: row.isPublished,
  };
}

export function CategoryTagPageDialog({
  row,
  open,
  onOpenChange,
}: CategoryTagPageDialogProps) {
  const updateCategoryTag = useUpdateCategoryTag();
  const [form, setForm] = useState(() => formStateFromRow(row));
  const pending = updateCategoryTag.isPending;

  function resetForm() {
    setForm(formStateFromRow(row));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      await updateCategoryTag.mutateAsync({
        name: row.name,
        slug: form.slug.trim() || null,
        heroTitleBefore: form.heroTitleBefore,
        heroTitleEmphasis: form.heroTitleEmphasis,
        heroTitleAfter: form.heroTitleAfter,
        subtitle: form.subtitle,
        description: form.description,
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        isPublished: form.isPublished,
      });
      toast.success("Page enregistrée.");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Enregistrement impossible.",
      );
    }
  }

  const previewHref =
    form.slug.trim() && form.isPublished
      ? categoryTagPublicPath(row.tagType, form.slug.trim())
      : null;

  const heroDefaults = isPublishableTagType(row.tagType)
    ? defaultHeroTitleForTag(row.tagType, row.name)
    : {
        heroTitleBefore: "",
        heroTitleEmphasis: row.name,
        heroTitleAfter: "",
      };

  const previewHero = {
    before: form.heroTitleBefore,
    emphasis: form.heroTitleEmphasis || row.name,
    after: form.heroTitleAfter,
  };

  function resetHeroTitleToDefaults() {
    setForm((current) => ({
      ...current,
      heroTitleBefore: heroDefaults.heroTitleBefore ?? "",
      heroTitleEmphasis: heroDefaults.heroTitleEmphasis ?? row.name,
      heroTitleAfter: heroDefaults.heroTitleAfter ?? "",
    }));
  }

  const pagePath =
    row.tagType === "evenement"
      ? "/evenements/[slug]"
      : row.tagType === "danse"
        ? "/danse/[slug]"
        : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetForm();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              Page publique — {row.name}
            </DialogTitle>
            <DialogDescription>
              Le nom du tag ({row.name}) sert au filtrage des événements iCal.
              {pagePath
                ? ` Le slug et le contenu ci-dessous alimentent la page publique ${pagePath}.`
                : " Seuls les tags Danse et Événement peuvent avoir une page publique."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`slug-${row.name}`}>Slug URL</Label>
            <Input
              id={`slug-${row.name}`}
              value={form.slug}
              onChange={(event) =>
                setForm((current) => ({ ...current, slug: event.target.value }))
              }
              placeholder="lindy-hop"
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-3 rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Titre de la page</p>
              <p className="text-muted-foreground text-xs">
                Trois segments : le segment du milieu est mis en emphase
                (couleur primaire). Les champs sont préremplis avec les valeurs
                par défaut du type de tag ; modifiez-les librement, y compris en
                laissant un segment vide.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={resetHeroTitleToDefaults}
              >
                Réinitialiser le titre
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`hero-before-${row.name}`}>Avant l&apos;emphase</Label>
              <Input
                id={`hero-before-${row.name}`}
                value={form.heroTitleBefore}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    heroTitleBefore: event.target.value,
                  }))
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`hero-emphasis-${row.name}`}>Emphase</Label>
              <Input
                id={`hero-emphasis-${row.name}`}
                value={form.heroTitleEmphasis}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    heroTitleEmphasis: event.target.value,
                  }))
                }
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor={`hero-after-${row.name}`}>Après l&apos;emphase</Label>
              <Input
                id={`hero-after-${row.name}`}
                value={form.heroTitleAfter}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    heroTitleAfter: event.target.value,
                  }))
                }
              />
            </div>

            <div className="bg-muted/40 rounded-md p-3">
              <p className="text-muted-foreground mb-2 text-xs font-medium uppercase tracking-wide">
                Aperçu
              </p>
              <DanceHeroTitle
                as="p"
                name={row.name}
                resolved={previewHero}
                className="text-xl md:text-2xl"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`subtitle-${row.name}`}>Sous-titre</Label>
            <Input
              id={`subtitle-${row.name}`}
              value={form.subtitle}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  subtitle: event.target.value,
                }))
              }
              placeholder="Courte accroche sous le titre"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`description-${row.name}`}>Description</Label>
            <Textarea
              id={`description-${row.name}`}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={5}
              placeholder="Présentation du style de danse"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`seo-title-${row.name}`}>Titre SEO</Label>
            <Input
              id={`seo-title-${row.name}`}
              value={form.seoTitle}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  seoTitle: event.target.value,
                }))
              }
              placeholder="Optionnel"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`seo-description-${row.name}`}>
              Description SEO
            </Label>
            <Textarea
              id={`seo-description-${row.name}`}
              value={form.seoDescription}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  seoDescription: event.target.value,
                }))
              }
              rows={3}
              placeholder="Optionnel"
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`published-${row.name}`}>Publiée</Label>
              <p className="text-muted-foreground text-xs">
                Nécessite un slug. La page est visible uniquement si publiée.
              </p>
            </div>
            <Switch
              id={`published-${row.name}`}
              checked={form.isPublished}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, isPublished: checked }))
              }
            />
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {previewHref ? (
              <a
                href={previewHref}
                target="_blank"
                rel="noreferrer"
                className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium"
              >
                <ExternalLink className="size-4" aria-hidden />
                Aperçu
              </a>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={pending}>
                Enregistrer
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
