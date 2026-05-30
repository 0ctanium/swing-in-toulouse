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
import { useDeleteOrganization } from "@/lib/admin/use-organizations";
import type { AdminOrganizationRow } from "@/lib/organizations/admin";

type OrganizationDeleteDialogProps = {
  organization: AdminOrganizationRow | null;
  onOpenChange: (open: boolean) => void;
};

export function OrganizationDeleteDialog({
  organization,
  onOpenChange,
}: OrganizationDeleteDialogProps) {
  const deleteOrganization = useDeleteOrganization();
  const open = organization !== null;
  const pending = deleteOrganization.isPending;

  async function handleDelete() {
    if (!organization) {
      return;
    }

    try {
      await deleteOrganization.mutateAsync(organization.id);
      toast.success("Organisateur supprimé.");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Suppression impossible.",
      );
    }
  }

  const hasLinkedData =
    organization &&
    (organization.sourceCount > 0 || organization.eventCount > 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cet organisateur ?</AlertDialogTitle>
          <AlertDialogDescription>
            {organization ? (
              <>
                <span className="font-medium text-foreground">
                  {organization.name}
                </span>{" "}
                sera supprimé définitivement.
                {hasLinkedData ? (
                  <>
                    {" "}
                    {organization.sourceCount} source
                    {organization.sourceCount > 1 ? "s" : ""} et{" "}
                    {organization.eventCount} événement
                    {organization.eventCount > 1 ? "s" : ""} liés perdront
                    leur organisateur (référence mise à null).
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
