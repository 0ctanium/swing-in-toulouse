"use client";

import { useEffect, useRef, useState } from "react";
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
import { EntitySelect } from "@/components/ui/entity-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateVenue, useUpdateVenue } from "@/lib/admin/use-venues";
import type { VenueCategory } from "@/db/schema";
import { generateVenueSlug } from "@/lib/slug";
import type { AdminVenueRow } from "@/lib/venues/admin-venue-row";
import { venueCategoryOptions } from "@/lib/venues/categories";

type VenueFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venue: AdminVenueRow | null;
};

function emptyFormState() {
  return {
    name: "",
    slug: "",
    address: "",
    city: "Toulouse",
    category: "",
  };
}

function formStateFromVenue(venue: AdminVenueRow) {
  return {
    name: venue.name,
    slug: venue.slug,
    address: venue.address ?? "",
    city: venue.city,
    category: venue.category ?? "",
  };
}

export function VenueFormDialog({
  open,
  onOpenChange,
  venue,
}: VenueFormDialogProps) {
  const isEdit = venue !== null;
  const createVenue = useCreateVenue();
  const updateVenue = useUpdateVenue(venue?.id ?? "");
  const slugManuallyEdited = useRef(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Toulouse");
  const [category, setCategory] = useState("");

  const pending = createVenue.isPending || updateVenue.isPending;
  const canSubmit = Boolean(name.trim() && slug.trim() && city.trim());

  useEffect(() => {
    if (!open) {
      return;
    }

    slugManuallyEdited.current = false;
    const nextState = venue ? formStateFromVenue(venue) : emptyFormState();
    setName(nextState.name);
    setSlug(nextState.slug);
    setAddress(nextState.address);
    setCity(nextState.city);
    setCategory(nextState.category);
  }, [open, venue]);

  function handleNameChange(nextName: string) {
    setName(nextName);

    if (!isEdit && !slugManuallyEdited.current) {
      setSlug(nextName.trim() ? generateVenueSlug(nextName) : "");
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      address: address.trim() || null,
      city: city.trim(),
      category: category ? (category as VenueCategory) : null,
    };

    try {
      if (isEdit) {
        await updateVenue.mutateAsync(payload);
        toast.success("Lieu enregistré.");
      } else {
        await createVenue.mutateAsync(payload);
        toast.success("Lieu créé.");
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
          <DialogTitle>{isEdit ? "Modifier le lieu" : "Nouveau lieu"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Les changements de nom ou d'adresse réinitialisent la confirmation Google. Utilisez Confirmer ou Adresse Google dans le tableau pour valider via Places."
              : "Créez un lieu principal. Confirmez l'adresse Google ensuite depuis le tableau si le lieu est utilisé par des événements."}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="venue-name">Nom</Label>
            <Input
              id="venue-name"
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              required
              disabled={pending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="venue-slug">Slug</Label>
            <Input
              id="venue-slug"
              value={slug}
              onChange={(event) => {
                slugManuallyEdited.current = true;
                setSlug(event.target.value);
              }}
              required
              disabled={pending || isEdit}
              placeholder="ex. trac-ecole"
            />
            <p className="text-muted-foreground text-xs">
              URL publique : /lieu/{slug || "…"}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="venue-address">Adresse</Label>
            <Input
              id="venue-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              disabled={pending}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="venue-city">Ville</Label>
            <Input
              id="venue-city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              required
              disabled={pending}
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
              options={venueCategoryOptions().map((option) => ({
                value: option.value,
                label: option.label,
              }))}
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
