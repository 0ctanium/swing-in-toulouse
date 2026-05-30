"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  VenueConfirmRow,
  venueConfirmMode,
} from "@/components/admin/venue-confirm-row";
import type { AdminVenueRow } from "@/lib/venues/admin-venue-row";

type VenueConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venue: AdminVenueRow | null;
};

export function VenueConfirmDialog({
  open,
  onOpenChange,
  venue,
}: VenueConfirmDialogProps) {
  if (!venue) {
    return null;
  }

  const mode = venueConfirmMode(venue);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,40rem)] flex-col gap-0 overflow-hidden sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? "Adresse Google"
              : "Confirmer l'adresse"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Mettez à jour le lieu via Google Places (nom, catégorie, coordonnées)."
              : "Validez ce lieu actif avec une adresse et des coordonnées GPS."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto pt-2">
          <VenueConfirmRow
            venue={venue}
            mode={mode}
            onCancel={() => onOpenChange(false)}
            onSaved={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
