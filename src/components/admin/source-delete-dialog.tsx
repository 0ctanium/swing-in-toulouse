"use client";

import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteSource } from "@/lib/admin/use-sources";
import type { AdminSourceRow } from "@/lib/sources/admin";

type SourceDeleteDialogProps = {
  source: AdminSourceRow | null;
  onOpenChange: (open: boolean) => void;
};

export function SourceDeleteDialog({
  source,
  onOpenChange,
}: SourceDeleteDialogProps) {
  const deleteSource = useDeleteSource();
  const open = source !== null;
  const pending = deleteSource.isPending;

  async function handleDelete() {
    if (!source) {
      return;
    }

    try {
      await deleteSource.mutateAsync(source.id);
      toast.success("Source supprimée.");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Suppression impossible.",
      );
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cette source ?</AlertDialogTitle>
          <AlertDialogDescription>
            {source ? (
              <>
                <span className="font-medium text-foreground">
                  {source.name}
                </span>{" "}
                sera supprimée définitivement.
                {source.eventCount > 0 ? (
                  <>
                    {" "}
                    Les {source.eventCount} événement
                    {source.eventCount > 1 ? "s" : ""} importés depuis ce flux
                    seront également supprimés.
                  </>
                ) : null}
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              void handleDelete();
            }}
          >
            {pending ? "Suppression…" : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
