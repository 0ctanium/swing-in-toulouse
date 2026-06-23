import { OrganizationSwitcher } from "@clerk/nextjs";

export function AdminOrgSelectionPrompt() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed p-10 text-center">
      <h2 className="font-heading text-xl font-semibold">
        Sélectionnez une organisation
      </h2>
      <p className="text-muted-foreground max-w-md text-sm">
        Choisissez l&apos;organisateur à gérer pour accéder à son planning, ses
        sources et ses événements.
      </p>
      <OrganizationSwitcher hidePersonal />
    </div>
  );
}
